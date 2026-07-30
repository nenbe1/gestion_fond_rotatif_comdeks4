# Fonds Rotatif MMF — Mobile

Application Mobile (React Native + Expo) pour les **Membres du comité**
(traiter le circuit de validation des demandes) et les **Bénéficiaires**
(consulter leur compte). La Responsable et les Autorités utilisent la
plateforme **Web**, pas cette application.

## Démarrage (première fois)

1. **Installer Node.js** si ce n'est pas déjà fait (déjà nécessaire pour le Web).
2. Sur votre téléphone : installer l'application **Expo Go** (Play Store / App Store).
3. Dans ce dossier, installer les dépendances :
   ```
   npm install
   npx expo install --fix
   ```
   La deuxième commande est importante : elle aligne automatiquement
   toutes les versions sur le SDK d'Expo réellement installé (au cas où
   Expo Go se met à jour de son côté, ou si les numéros de version dans
   `package.json` prennent du retard).
4. **Étape indispensable avant de tester** : ouvrez `src/api/client.js` et
   remplacez `BASE_URL` par l'adresse IP locale de votre PC sur le
   réseau Wi-Fi (pas `localhost`, qui ne fonctionne pas depuis un
   téléphone) :
   - Windows : `ipconfig` dans un terminal, cherchez "Adresse IPv4"
   - Mac/Linux : `ifconfig` (ou `ip addr`), cherchez `inet` sur votre interface Wi-Fi
   - Exemple : `const BASE_URL = 'http://192.168.1.42:5000/api';`
   - Votre téléphone et votre PC doivent être sur le **même réseau Wi-Fi**.
5. Démarrer le backend (`gestionFondRotatif/backend`) comme d'habitude — il doit tourner pendant que vous testez le Mobile.
6. Démarrer le projet Mobile :
   ```
   npx expo start
   ```
7. Scanner le QR code affiché dans le terminal avec l'appareil photo (iPhone) ou l'app Expo Go (Android). L'app se charge sur votre téléphone.

## Ce qui est fonctionnel aujourd'hui

- Connexion (téléphone + mot de passe), avec redirection automatique selon le rôle.
- **Comité** : liste des demandes de financement → détail → approuver/rejeter sa propre étape du circuit.
- **Bénéficiaire** : "Mon compte" — financements reçus, montant total, reste à rembourser, statut MMF.

## Ce qu'il reste à faire (pas encore construit)

- Remboursements individuels côté bénéficiaire (consultation détaillée)
- Remboursement collectif côté comité
- Gestion hors-ligne (aucune donnée en cache si pas de réseau)
- Notifications
- Icônes/splash screen personnalisés (actuellement les valeurs par défaut d'Expo)
