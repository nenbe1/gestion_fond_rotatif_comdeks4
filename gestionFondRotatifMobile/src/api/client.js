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
const BASE_URL = 'http://192.168.43.120:5000/api'; // IP locale de votre PC sur le Wi-Fi

/**
 * Effectue une requête vers l'API, en ajoutant automatiquement le token
 * de connexion s'il existe (stocké dans AsyncStorage après /connexion).
 * @param {string} chemin - ex: '/beneficiaires'
 * @param {Object} options - options standard de fetch (method, body...)
 * @throws {Error} avec le message renvoyé par le backend si la requête échoue
 */
async function appelerApi(chemin, options = {}) {
  const token = await AsyncStorage.getItem('token');

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
    const message = donnees.erreurs ? donnees.erreurs.join(' ') : (donnees.message || 'Erreur inconnue.');
    throw new Error(message);
  }

  return donnees;
}

export default appelerApi;
