/**
 * Client API centralisé pour communiquer avec le backend MMF.
 * Toutes les requêtes passent par ici, pour ne gérer qu'à un seul endroit
 * l'ajout du token JWT et le traitement des erreurs.
 */

// CORRECTION : l'adresse du backend s'adapte maintenant automatiquement
// à la façon dont le site est ouvert, au lieu d'être toujours
// "localhost" (ce qui ne marchait que depuis le PC lui-même). Si le
// site est ouvert via http://localhost:5173, le backend est appelé sur
// localhost:5000 ; si ouvert depuis un téléphone via
// http://192.168.x.x:5173 (voir vite.config.js), le backend est appelé
// sur cette même adresse réseau — sans rien à changer manuellement.
const BASE_URL = `http://${window.location.hostname}:5000/api`;

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

export { BASE_URL };
export default appelerApi;
