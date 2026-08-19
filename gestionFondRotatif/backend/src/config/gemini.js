require('dotenv').config();

/**
 * Client Gemini — appelle l'API Google Gemini (generateContent) en HTTP
 * brut via fetch (disponible nativement à partir de Node 18, pas besoin
 * d'ajouter axios comme dépendance).
 *
 * GEMINI_API_KEY et GEMINI_MODEL sont lus depuis le .env, jamais écrits
 * en dur ici. Tant que GEMINI_API_KEY n'est pas renseignée, genererReponse
 * échoue proprement avec un message clair (503), sans jamais faire
 * planter le serveur.
 */

const GEMINI_MODEL_PAR_DEFAUT = 'gemini-2.0-flash';

// Codes HTTP considérés comme transitoires (surcharge temporaire du
// service Gemini) : ça vaut le coup de réessayer avant d'abandonner.
const CODES_TRANSITOIRES = [503, 429];
const NB_TENTATIVES_MAX = 3;
const DELAI_BASE_MS = 800; // 800ms, puis 1600ms entre les tentatives

function attendre(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function urlGemini(modele) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${modele}:generateContent`;
}

/**
 * Une seule tentative d'appel à Gemini — utilisée en interne par
 * genererReponse(), qui gère elle les répétitions en cas d'échec transitoire.
 */
async function tenterAppelGemini(prompt, cleApi, modele) {
  let reponseHttp;
  try {
    reponseHttp = await fetch(`${urlGemini(modele)}?key=${cleApi}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });
  } catch (erreurReseau) {
    const erreur = new Error(`Impossible de contacter le service Gemini : ${erreurReseau.message}`);
    erreur.statusCode = 502;
    throw erreur;
  }

  if (!reponseHttp.ok) {
    const detail = await reponseHttp.text().catch(() => '');
    const erreur = new Error(
      `Le service Gemini a renvoyé une erreur (${reponseHttp.status}).${detail ? ' ' + detail : ''}`
    );
    erreur.statusCode = reponseHttp.status; // on garde le vrai code pour savoir si on peut réessayer
    throw erreur;
  }

  const donnees = await reponseHttp.json();
  const texte = donnees?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!texte) {
    const erreur = new Error("Le Conseiller IA n'a pas pu générer de réponse. Réessayez.");
    erreur.statusCode = 502;
    throw erreur;
  }

  return texte.trim();
}

/**
 * @param {string} prompt Texte complet envoyé au modèle (instructions + contexte + question).
 * @returns {Promise<string>} Réponse texte générée par Gemini.
 *
 * En cas d'erreur transitoire (503 "surchargé", 429 "trop de requêtes"),
 * réessaie automatiquement jusqu'à NB_TENTATIVES_MAX fois avec un court
 * délai croissant, avant de renvoyer un message clair et présentable côté
 * utilisateur (plutôt que le JSON brut renvoyé par Gemini).
 */
async function genererReponse(prompt) {
  const cleApi = process.env.GEMINI_API_KEY;
  const modele = process.env.GEMINI_MODEL || GEMINI_MODEL_PAR_DEFAUT;

  if (!cleApi) {
    const erreur = new Error(
      "Le Conseiller IA n'est pas encore configuré : clé API Gemini manquante (GEMINI_API_KEY dans le .env)."
    );
    erreur.statusCode = 503;
    throw erreur;
  }

  let derniereErreur;

  for (let tentative = 1; tentative <= NB_TENTATIVES_MAX; tentative += 1) {
    try {
      return await tenterAppelGemini(prompt, cleApi, modele);
    } catch (erreur) {
      derniereErreur = erreur;

      const estTransitoire = CODES_TRANSITOIRES.includes(erreur.statusCode);
      const derniereTentative = tentative === NB_TENTATIVES_MAX;

      if (!estTransitoire || derniereTentative) break;

      console.warn(
        `[conseiller_ia] Gemini indisponible (tentative ${tentative}/${NB_TENTATIVES_MAX}), nouvel essai dans ${DELAI_BASE_MS * tentative}ms...`
      );
      await attendre(DELAI_BASE_MS * tentative);
    }
  }

  // Message présentable pour l'utilisateur final si le service est
  // toujours surchargé après toutes les tentatives — le détail technique
  // (JSON de Gemini) reste dans les logs serveur (derniereErreur), pas
  // affiché à l'écran.
  if (CODES_TRANSITOIRES.includes(derniereErreur.statusCode)) {
    console.error('[conseiller_ia] Échec Gemini après toutes les tentatives :', derniereErreur.message);
    const erreurPresentable = new Error(
      'Le Conseiller IA est temporairement très sollicité. Merci de réessayer dans quelques instants.'
    );
    erreurPresentable.statusCode = 503;
    throw erreurPresentable;
  }

  throw derniereErreur;
}

module.exports = { genererReponse };
