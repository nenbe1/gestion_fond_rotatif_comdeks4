const beneficiaireService = require('../../beneficiaires/service/beneficiaire.service');
const conseillerIARepository = require('../repository/conseiller_ia.repository');
const ConseillerIAEchange = require('../model/conseiller_ia_echange.model');
const gemini = require('../../../config/gemini');

/**
 * Construit le contexte financier textuel du bénéficiaire, injecté dans
 * le prompt envoyé à Gemini — c'est ce qui rend les réponses personnalisées
 * (et pas de simples généralités), en réutilisant consulterMonCompte()
 * du module beneficiaires plutôt que de recalculer quoi que ce soit ici.
 */
function construireContexte(compte) {
  const { beneficiaire, situation, financements } = compte;

  const ligneFinancements = financements.length === 0
    ? "Aucun financement reçu pour l'instant."
    : financements.map((f) => (
        `- ${f.codeFinancement} : attribué ${f.montantAttribue} FCFA, `
        + `montant dû avec majoration ${f.montantDu.toFixed(0)} FCFA, `
        + `déjà remboursé ${f.montantRembourse.toFixed(0)} FCFA, `
        + `reste à payer ${f.resteAPayer.toFixed(0)} FCFA`
        + `${f.soldee ? ' (soldé)' : ''}`
      )).join('\n');

  return `
Profil du bénéficiaire :
- Nom : ${beneficiaire.nom} ${beneficiaire.prenom}
- Statut MMF : ${beneficiaire.statutMMF}
- Nombre de financements reçus : ${situation.nombreFinancements}
- Montant total attribué : ${situation.totalAttribue.toFixed(0)} FCFA
- Montant total dû (avec majoration) : ${situation.totalDu.toFixed(0)} FCFA
- Montant total remboursé : ${situation.totalRembourse.toFixed(0)} FCFA
- Reste à payer (tous financements confondus) : ${situation.resteAPayer.toFixed(0)} FCFA

Détail des financements :
${ligneFinancements}
  `.trim();
}

/**
 * Équivalent de construireContexte(), mais agrégé au niveau d'un canton
 * entier plutôt qu'un seul bénéficiaire — utilisé côté Web (Responsable),
 * qui supervise plusieurs cantons et n'a pas besoin d'un détail
 * individuel à ce stade (elle instruit ensuite les dossiers précis avec
 * le comité local du canton concerné).
 */
function construireContexteCanton(donneesCanton) {
  const { canton, situation, beneficiaires } = donneesCanton;

  const enDifficulte = beneficiaires
    .filter((b) => b.resteAPayer > 0)
    .sort((a, b) => b.resteAPayer - a.resteAPayer)
    .slice(0, 10);

  const ligneEnDifficulte = enDifficulte.length === 0
    ? "Aucun bénéficiaire avec un reste à payer en cours."
    : enDifficulte.map((b) => `- ${b.nom} ${b.prenom} (${b.statutMMF}) : reste à payer ${b.resteAPayer.toFixed(0)} FCFA`).join('\n');

  return `
Situation du canton de ${canton.nom} :
- Nombre de bénéficiaires : ${situation.nombreBeneficiaires}
- Montant total attribué : ${situation.totalAttribue.toFixed(0)} FCFA
- Montant total dû (avec majoration) : ${situation.totalDu.toFixed(0)} FCFA
- Montant total remboursé : ${situation.totalRembourse.toFixed(0)} FCFA
- Reste à payer global : ${situation.resteAPayer.toFixed(0)} FCFA
- Bénéficiaires avec un reste à payer en cours : ${situation.nombreBeneficiairesEnDifficulte}

Bénéficiaires avec le plus gros reste à payer (jusqu'à 10) :
${ligneEnDifficulte}
  `.trim();
}

/**
 * Le prompt système rappelle explicitement que la décision finale
 * d'accorder un nouveau prêt appartient au comité (circuit de validation
 * à 3 niveaux déjà en place) — le Conseiller IA informe et oriente, il ne
 * décide jamais à la place du comité.
 */
function construirePrompt(contexte, question) {
  return `
Tu es le Conseiller Financier IA de l'application de gestion du Fonds Rotatif MMF (COMDEKS4, AJEOV Technologies), destinée à des femmes et jeunes bénéficiaires en zone rurale au Cameroun.

Règles :
- Réponds en français, de façon simple, claire et bienveillante (peu de jargon financier).
- Base-toi UNIQUEMENT sur les données réelles du bénéficiaire fournies ci-dessous.
- Tu peux donner un avis ou une estimation, mais rappelle que la décision finale d'accorder un nouveau prêt appartient toujours au comité (Trésorier, Commissaire, Président) — tu ne peux jamais garantir une approbation.
- Sois concis : 3 à 6 phrases maximum, sauf si la question demande clairement plus de détail.

${contexte}

Question du bénéficiaire : "${question}"

Réponds directement à sa question.
  `.trim();
}

/**
 * Prompt de l'analyse complète — même contexte financier que le prompt
 * question/réponse, mais on demande à Gemini de structurer sa réponse en
 * 4 sections fixes avec des titres "## " (repérés côté client pour être
 * mis en valeur), plutôt que de répondre à une question précise.
 */
function construirePromptAnalyse(contexte) {
  return `
Tu es le Conseiller Financier IA de l'application de gestion du Fonds Rotatif MMF (COMDEKS4, AJEOV Technologies), destinée à des femmes et jeunes bénéficiaires en zone rurale au Cameroun.

Règles :
- Réponds en français, de façon simple, claire et bienveillante (peu de jargon financier).
- Base-toi UNIQUEMENT sur les données réelles du bénéficiaire fournies ci-dessous.
- Rappelle si besoin que la décision finale d'accorder un nouveau prêt appartient toujours au comité (Trésorier, Commissaire, Président) — tu ne peux jamais garantir une approbation.
- Structure IMPÉRATIVEMENT ta réponse en 4 sections, chacune précédée d'un titre au format "## Titre" (sur sa propre ligne), dans cet ordre exact :
  ## Résumé
  ## Analyse financière
  ## Risques identifiés
  ## Conseils personnalisés
- Chaque section fait 2 à 4 phrases maximum.

${contexte}

Génère l'analyse financière complète du bénéficiaire, en respectant strictement les 4 sections demandées.
  `.trim();
}

/**
 * Variantes canton des deux prompts ci-dessus, destinées à la
 * Responsable (Web) : le destinataire n'est plus "le bénéficiaire" mais
 * "la Responsable qui supervise ce canton" — le ton et l'angle changent
 * en conséquence (vision d'ensemble et priorisation, plutôt que conseil
 * personnalisé direct à un bénéficiaire).
 */
function construirePromptCanton(contexte, question) {
  return `
Tu es le Conseiller Financier IA de l'application de gestion du Fonds Rotatif MMF (COMDEKS4, AJEOV Technologies), destinée à des femmes et jeunes bénéficiaires en zone rurale au Cameroun.

Tu t'adresses ici à la Responsable, qui supervise plusieurs cantons et consulte la situation agrégée d'un canton précis (chaque canton a son propre membre du comité sur le terrain).

Règles :
- Réponds en français, de façon simple et claire.
- Base-toi UNIQUEMENT sur les données réelles du canton fournies ci-dessous.
- Aide-la à prioriser (quels bénéficiaires ou quelles tendances méritent son attention), sans jamais décider à sa place.
- Sois concis : 3 à 6 phrases maximum, sauf si la question demande clairement plus de détail.

${contexte}

Question de la Responsable : "${question}"

Réponds directement à sa question.
  `.trim();
}

function construirePromptAnalyseCanton(contexte) {
  return `
Tu es le Conseiller Financier IA de l'application de gestion du Fonds Rotatif MMF (COMDEKS4, AJEOV Technologies), destinée à des femmes et jeunes bénéficiaires en zone rurale au Cameroun.

Tu t'adresses ici à la Responsable, qui supervise plusieurs cantons et consulte la situation agrégée d'un canton précis (chaque canton a son propre membre du comité sur le terrain).

Règles :
- Réponds en français, de façon simple et claire.
- Base-toi UNIQUEMENT sur les données réelles du canton fournies ci-dessous.
- Structure IMPÉRATIVEMENT ta réponse en 4 sections, chacune précédée d'un titre au format "## Titre" (sur sa propre ligne), dans cet ordre exact :
  ## Résumé
  ## Analyse financière
  ## Points d'attention
  ## Recommandations
- Chaque section fait 2 à 4 phrases maximum.

${contexte}

Génère l'analyse complète de ce canton, en respectant strictement les 4 sections demandées.
  `.trim();
}

function erreur(message, statusCode) {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
}

/**
 * @param {number} utilisateurId Id de l'utilisateur connecté (extrait du token).
 * @param {string} question Question posée par le bénéficiaire.
 */
async function poserQuestion(utilisateurId, question) {
  const compte = await beneficiaireService.consulterMonCompte(utilisateurId);
  const contexte = construireContexte(compte);
  const prompt = construirePrompt(contexte, question);

  const reponse = await gemini.genererReponse(prompt);

  const row = await conseillerIARepository.enregistrer({
    beneficiaire_id: compte.beneficiaire.id,
    question,
    reponse,
  });

  return ConseillerIAEchange.fromRow(row);
}

async function consulterHistorique(utilisateurId) {
  const compte = await beneficiaireService.consulterMonCompte(utilisateurId);
  const rows = await conseillerIARepository.findByBeneficiaireId(compte.beneficiaire.id);
  return rows.map(ConseillerIAEchange.fromRow);
}

/**
 * @param {number} utilisateurId Id de l'utilisateur connecté (extrait du token).
 * Génère l'analyse financière complète en une seule réponse Gemini
 * structurée en 4 sections (bouton "📊 Analyse" côté mobile). Enregistrée
 * dans le même historique que les questions libres, avec une question
 * conventionnelle fixe pour la distinguer d'un coup d'œil.
 */
async function genererAnalyse(utilisateurId) {
  const compte = await beneficiaireService.consulterMonCompte(utilisateurId);
  const contexte = construireContexte(compte);
  const prompt = construirePromptAnalyse(contexte);

  const reponse = await gemini.genererReponse(prompt);

  const row = await conseillerIARepository.enregistrer({
    beneficiaire_id: compte.beneficiaire.id,
    question: 'Analyse financière complète',
    reponse,
  });

  return ConseillerIAEchange.fromRow(row);
}

/**
 * Variantes Mobile pour le comité (voir conseiller_ia.routes.js) : un
 * membre du comité choisit le bénéficiaire consulté plutôt que
 * d'interroger sa propre situation — utile pendant l'instruction d'un
 * dossier de prêt, restreint aux bénéficiaires de son propre canton.
 * Même contexte, même prompt, même historique partagé que les fonctions
 * Mobile bénéficiaire ci-dessus ; seule la façon de retrouver le compte
 * change (par id de bénéficiaire, via consulterCompteParId, plutôt que
 * par utilisateur connecté).
 */
async function poserQuestionPourBeneficiaire(beneficiaireId, question) {
  const compte = await beneficiaireService.consulterCompteParId(beneficiaireId);
  const contexte = construireContexte(compte);
  const prompt = construirePrompt(contexte, question);

  const reponse = await gemini.genererReponse(prompt);

  const row = await conseillerIARepository.enregistrer({
    beneficiaire_id: compte.beneficiaire.id,
    question,
    reponse,
  });

  return ConseillerIAEchange.fromRow(row);
}

async function genererAnalysePourBeneficiaire(beneficiaireId) {
  const compte = await beneficiaireService.consulterCompteParId(beneficiaireId);
  const contexte = construireContexte(compte);
  const prompt = construirePromptAnalyse(contexte);

  const reponse = await gemini.genererReponse(prompt);

  const row = await conseillerIARepository.enregistrer({
    beneficiaire_id: compte.beneficiaire.id,
    question: 'Analyse financière complète',
    reponse,
  });

  return ConseillerIAEchange.fromRow(row);
}

async function consulterHistoriquePourBeneficiaire(beneficiaireId) {
  await beneficiaireService.consulterCompteParId(beneficiaireId); // vérifie que le bénéficiaire existe
  const rows = await conseillerIARepository.findByBeneficiaireId(beneficiaireId);
  return rows.map(ConseillerIAEchange.fromRow);
}

/**
 * Variantes Web, réservées à la Responsable : elle consulte la
 * situation agrégée d'un canton entier plutôt que celle d'un
 * bénéficiaire précis (voir conseiller_ia.routes.js).
 */
async function poserQuestionPourCanton(cantonId, question) {
  const donneesCanton = await beneficiaireService.consulterSituationCanton(cantonId);
  const contexte = construireContexteCanton(donneesCanton);
  const prompt = construirePromptCanton(contexte, question);

  const reponse = await gemini.genererReponse(prompt);

  const row = await conseillerIARepository.enregistrer({
    canton_id: donneesCanton.canton.id,
    question,
    reponse,
  });

  return ConseillerIAEchange.fromRow(row);
}

async function genererAnalysePourCanton(cantonId) {
  const donneesCanton = await beneficiaireService.consulterSituationCanton(cantonId);
  const contexte = construireContexteCanton(donneesCanton);
  const prompt = construirePromptAnalyseCanton(contexte);

  const reponse = await gemini.genererReponse(prompt);

  const row = await conseillerIARepository.enregistrer({
    canton_id: donneesCanton.canton.id,
    question: 'Analyse financière complète',
    reponse,
  });

  return ConseillerIAEchange.fromRow(row);
}

async function consulterHistoriquePourCanton(cantonId) {
  await beneficiaireService.consulterSituationCanton(cantonId); // vérifie que le canton existe
  const rows = await conseillerIARepository.findByCantonId(cantonId);
  return rows.map(ConseillerIAEchange.fromRow);
}

module.exports = {
  poserQuestion,
  consulterHistorique,
  genererAnalyse,
  poserQuestionPourBeneficiaire,
  genererAnalysePourBeneficiaire,
  consulterHistoriquePourBeneficiaire,
  poserQuestionPourCanton,
  genererAnalysePourCanton,
  consulterHistoriquePourCanton,
};
