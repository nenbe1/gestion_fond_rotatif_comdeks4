/**
 * Client API centralisé pour communiquer avec le backend MMF.
 * Toutes les requêtes passent par ici, pour ne gérer qu'à un seul endroit
 * l'ajout du token JWT et le traitement des erreurs.
 */

const BASE_URL = 'http://localhost:5000/api';

/**
 * Effectue une requête vers l'API, en ajoutant automatiquement le token
 * de connexion s'il existe (stocké dans localStorage après /connexion).
 * @param {string} chemin - ex: '/beneficiaires'
 * @param {Object} options - options standard de fetch (method, body...)
 * @throws {Error} avec le message renvoyé par le backend si la requête échoue
 */
async function appelerApi(chemin, options = {}) {
  const token = localStorage.getItem('token');

  const reponse = await fetch(`${BASE_URL}${chemin}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const donnees = await reponse.json().catch(() => ({}));

  if (!reponse.ok) {
    // Le backend renvoie soit { message }, soit { erreurs: [...] }
    const message = donnees.erreurs ? donnees.erreurs.join(' ') : (donnees.message || 'Erreur inconnue.');
    throw new Error(message);
  }

  return donnees;
}

// AJOUT : exporté pour les cas où on a besoin de l'URL brute (ex: télécharger
// un fichier binaire/texte via fetch direct, comme la sauvegarde SQL dans
// Administration.jsx, plutôt que le JSON automatique de appelerApi).
export { BASE_URL };
export default appelerApi;
