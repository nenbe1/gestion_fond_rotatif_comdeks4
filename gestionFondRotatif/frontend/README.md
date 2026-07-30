# Frontend — Gestion Fonds Rotatif COMDEKS4

Interface web minimale pour l'administration du fonds rotatif (React + Vite).

## Installation

```bash
npm install
npm run dev
```

L'application démarre sur `http://localhost:5173` (ou le prochain port
disponible) et communique avec le backend sur `http://localhost:5000`
(voir `src/api/client.js` pour l'URL de base).

**Prérequis :** le backend doit être démarré (`npm run dev` dans
`../backend/`) et connecté à une base MySQL contenant au moins un
compte utilisateur pour se connecter.

## Structure

```
src/
  api/client.js          -- client HTTP centralisé (token, erreurs)
  context/AuthContext.jsx -- état de connexion partagé
  components/
    MiseEnPage.jsx        -- barre latérale + zone de contenu
  pages/
    Connexion.jsx
    TableauDeBord.jsx
    Beneficiaires.jsx
    Demandes.jsx
    DetailDemande.jsx     -- circuit de validation, actions, décision Responsable
    Rapports.jsx
```

## Statut

Couverture actuelle : authentification, bénéficiaires (liste/création),
demandes de financement (liste/création), circuit de validation complet
(approbation/rejet par étape, décision finale de la Responsable),
rapports (génération/consultation).

**Non couvert pour l'instant** (backend prêt, écran à faire) : gestion
des membres du comité, attributions/remboursements, paramétrage.
