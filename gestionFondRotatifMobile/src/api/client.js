import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Client API centralisé pour communiquer avec le backend MMF depuis le
 * Mobile. Même logique que frontend/src/api/client.js (Web), mais le
 * token est lu depuis AsyncStorage (asynchrone) plutôt que localStorage.
 *
 * ⚠️ À adapter : 'localhost' ne fonctionne PAS depuis un téléphone/émulateur
 * (le mobile ne "voit" pas le localhost de votre PC). Remplacez par
 * l'adresse IP locale de votre machine sur le réseau Wi-Fi
 * (ex: 'http://192.168.1.42:5000/api'), trouvable avec `ipconfig` (Windows)
 * ou `ifconfig` (Mac/Linux). Pour un émulateur Android, '10.0.2.2'
 * remplace 'localhost'.
 */
// URL de l'API — configurable via la variable d'environnement
// EXPO_PUBLIC_API_URL (fichier .env, voir .env.example) pour la
// production. En développement, si elle n'est pas définie, on retombe
// sur l'IP locale du PC sur le Wi-Fi (à adapter à votre propre réseau).
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.43.120:5000/api'; // IP locale de votre PC sur le Wi-Fi (développement uniquement)

/**
 * Effectue une requête vers l'API, en ajoutant automatiquement le token
 * de connexion s'il existe (stocké dans AsyncStorage après /connexion).
 *
 * AJOUT : si options.body est un FormData (upload de fichier, ex: photo
 * de bénéficiaire), on n'ajoute PAS le Content-Type nous-mêmes (fetch le
 * fait automatiquement avec le bon "boundary" multipart) et on n'essaie
 * pas de le JSON.stringify — sinon l'upload échoue silencieusement.
 * Le comportement JSON existant est inchangé pour tous les autres appels.
 * @param {string} chemin - ex: '/beneficiaires'
 * @param {Object} options - options standard de fetch (method, body...)
 * @throws {Error} avec le message renvoyé par le backend si la requête échoue
 */
async function appelerApi(chemin, options = {}) {
  const token = await AsyncStorage.getItem('token');
  const estFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const reponse = await fetch(`${BASE_URL}${chemin}`, {
    ...options,
    headers: {
      ...(estFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: estFormData ? options.body : (options.body ? JSON.stringify(options.body) : undefined),
  });

  const donnees = await reponse.json().catch(() => ({}));

  if (!reponse.ok) {
    const message = donnees.erreurs ? donnees.erreurs.join(' ') : (donnees.message || 'Erreur inconnue.');
    throw new Error(message);
  }

  return donnees;
}

export { BASE_URL };
export default appelerApi;
