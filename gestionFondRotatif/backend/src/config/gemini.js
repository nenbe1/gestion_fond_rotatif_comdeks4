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

function urlGemini(modele) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${modele}:generateContent`;
}

/**
 * @param {string} prompt Texte complet envoyé au modèle (instructions + contexte + question).
 * @returns {Promise<string>} Réponse texte générée par Gemini.
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
    erreur.statusCode = 502;
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

module.exports = { genererReponse };
