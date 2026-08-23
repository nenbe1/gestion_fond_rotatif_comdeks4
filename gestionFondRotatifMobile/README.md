# Fonds Rotatif MMF — Mobile

Application Mobile (React Native + Expo) pour les **Membres du comité**
et les **Bénéficiaires**. La Responsable et les Autorités utilisent la
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
5. Démarrer le backend (`gestionFondRotatif/backend`) comme d'habitude — il doit tourner pendant que vous testez le Mobile, avec `GEMINI_API_KEY` renseignée dans son `.env` pour que le Conseiller IA fonctionne.
6. Démarrer le projet Mobile :
   ```
   npx expo start
   ```
   (ajouter `-c` pour vider le cache après une mise à jour importante,
   ex : nouvelle dépendance installée)
7. Scanner le QR code affiché dans le terminal avec l'appareil photo (iPhone) ou l'app Expo Go (Android). L'app se charge sur votre téléphone.

## Ce qui est fonctionnel aujourd'hui

- Connexion (téléphone + mot de passe), avec redirection automatique selon le rôle.
- **Comité** :
  - Demandes de financement (créer, suivre, traiter sa propre étape du circuit)
  - Financements et remboursements (individuel + collectif)
  - Bénéficiaires (créer, modifier, photo de profil, géolocalisation)
  - Groupes MMF (créer, gérer les membres et le responsable)
  - Cotisations (enregistrer, modifier, annuler, reçu PDF, filtres par période)
  - Conseiller IA pour un bénéficiaire de son propre canton (question libre + analyse complète)
  - Centre de notifications
- **Bénéficiaire** :
  - "Mon compte" — financements reçus, reste à rembourser, statut MMF
  - Mes groupes MMF et mes cotisations (historique, reçu PDF)
  - Conseiller IA personnel (question libre + analyse financière complète structurée)
  - Centre de notifications

## Ce qu'il reste à faire (pas encore construit)

- Gestion hors-ligne (aucune donnée en cache si pas de réseau) — piste
  envisagée : mise en attente locale des actions terrain (remboursement,
  cotisation) avec synchronisation automatique au retour du réseau,
  plutôt qu'un mode hors-ligne complet
- Icônes/splash screen personnalisés (actuellement les valeurs par défaut d'Expo)
