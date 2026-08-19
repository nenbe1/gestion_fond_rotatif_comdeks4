const conseillerIAService = require('../service/conseiller_ia.service');
const beneficiaireService = require('../../beneficiaires/service/beneficiaire.service');
const membreComiteRepository = require('../../membres_comite/repository/membre_comite.repository');

/** POST /api/conseiller-ia/demander — le bénéficiaire connecté pose une question. */
async function demander(req, res) {
  try {
    const echange = await conseillerIAService.poserQuestion(req.utilisateurId, req.body.question);
    res.status(201).json({ echange });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** GET /api/conseiller-ia/historique — l'historique des échanges du bénéficiaire connecté. */
async function consulterHistorique(req, res) {
  try {
    const historique = await conseillerIAService.consulterHistorique(req.utilisateurId);
    res.status(200).json({ historique });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** POST /api/conseiller-ia/analyse — génère l'analyse financière complète (4 sections) du bénéficiaire connecté. */
async function analyser(req, res) {
  try {
    const echange = await conseillerIAService.genererAnalyse(req.utilisateurId);
    res.status(201).json({ echange });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/**
 * Variantes Mobile (comité) : le bénéficiaire consulté vient de l'URL
 * (:id), pas de l'utilisateur connecté — voir conseiller_ia.routes.js
 * pour la restriction de rôle (MEMBRE_COMITE).
 *
 * Un membre du comité ne consulte que les bénéficiaires de son PROPRE
 * canton (même règle que pour la liste des bénéficiaires) : vérifié ici
 * plutôt que dans le service, pour rester cohérent avec le pattern déjà
 * utilisé par beneficiaires/controller.
 *
 * CORRECTION : compte.beneficiaire.cantonId et membre.cantonId viennent
 * de deux requêtes SQL différentes (l'une via une colonne directe,
 * l'autre via une jointure aliasée c.id AS canton_id) — mysql2 peut
 * renvoyer ces deux valeurs avec des types JS différents (Number vs
 * String) selon le chemin de la requête. Une comparaison stricte (!==)
 * les traitait donc parfois comme différentes alors que c'est le même
 * canton. Number() des deux côtés élimine ce piège.
 * @returns {boolean} true si autorisé (sinon la réponse 403 est déjà envoyée)
 */
/**
 * Variantes Mobile (comité) : le bénéficiaire consulté vient de l'URL
 * (:id), pas de l'utilisateur connecté — voir conseiller_ia.routes.js
 * pour la restriction de rôle (MEMBRE_COMITE).
 *
 * Un membre du comité ne consulte que les bénéficiaires de son PROPRE
 * canton (même règle que pour la liste des bénéficiaires) : vérifié ici
 * plutôt que dans le service, pour rester cohérent avec le pattern déjà
 * utilisé par beneficiaires/controller.
 *
 * CORRECTION : membreComiteRepository.findByUtilisateurId() renvoie la
 * ligne brute de la base (snake_case : membre.canton_id), pas un objet
 * passé par le modèle MembreComite (qui lui expose cantonId en
 * camelCase) — comme le fait déjà beneficiaires/controller.js ailleurs
 * dans le code. Utiliser membre.cantonId ici donnait toujours undefined,
 * ce qui faisait échouer la vérification même pour le bon canton.
 * @returns {boolean} true si autorisé (sinon la réponse 403 est déjà envoyée)
 */
async function estAutorisePourSonCanton(req, res, beneficiaireId) {
  const membre = await membreComiteRepository.findByUtilisateurId(req.utilisateurId);
  const compte = await beneficiaireService.consulterCompteParId(beneficiaireId);

  const cantonMembre = membre?.canton_id != null ? Number(membre.canton_id) : null;
  const cantonBeneficiaire = compte.beneficiaire.cantonId != null ? Number(compte.beneficiaire.cantonId) : null;

  if (!membre || cantonMembre === null || cantonBeneficiaire === null || cantonMembre !== cantonBeneficiaire) {
    res.status(403).json({ message: 'Ce bénéficiaire ne fait pas partie de votre canton.' });
    return false;
  }
  return true;
}

/** POST /api/conseiller-ia/beneficiaires/:id/demander */
async function demanderPourBeneficiaire(req, res) {
  try {
    if (!(await estAutorisePourSonCanton(req, res, req.params.id))) return;
    const echange = await conseillerIAService.poserQuestionPourBeneficiaire(req.params.id, req.body.question);
    res.status(201).json({ echange });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** POST /api/conseiller-ia/beneficiaires/:id/analyse */
async function analyserPourBeneficiaire(req, res) {
  try {
    if (!(await estAutorisePourSonCanton(req, res, req.params.id))) return;
    const echange = await conseillerIAService.genererAnalysePourBeneficiaire(req.params.id);
    res.status(201).json({ echange });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** GET /api/conseiller-ia/beneficiaires/:id/historique */
async function consulterHistoriquePourBeneficiaire(req, res) {
  try {
    if (!(await estAutorisePourSonCanton(req, res, req.params.id))) return;
    const historique = await conseillerIAService.consulterHistoriquePourBeneficiaire(req.params.id);
    res.status(200).json({ historique });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/**
 * Variantes Web (Responsable) : le canton consulté vient de l'URL (:id) —
 * voir conseiller_ia.routes.js pour la restriction de rôle (RESPONSABLE).
 */

/** POST /api/conseiller-ia/cantons/:id/demander */
async function demanderPourCanton(req, res) {
  try {
    const echange = await conseillerIAService.poserQuestionPourCanton(req.params.id, req.body.question);
    res.status(201).json({ echange });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** POST /api/conseiller-ia/cantons/:id/analyse */
async function analyserPourCanton(req, res) {
  try {
    const echange = await conseillerIAService.genererAnalysePourCanton(req.params.id);
    res.status(201).json({ echange });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** GET /api/conseiller-ia/cantons/:id/historique */
async function consulterHistoriquePourCanton(req, res) {
  try {
    const historique = await conseillerIAService.consulterHistoriquePourCanton(req.params.id);
    res.status(200).json({ historique });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

module.exports = {
  demander,
  consulterHistorique,
  analyser,
  demanderPourBeneficiaire,
  analyserPourBeneficiaire,
  consulterHistoriquePourBeneficiaire,
  demanderPourCanton,
  analyserPourCanton,
  consulterHistoriquePourCanton,
};
