# Frontend — Gestion Fonds Rotatif COMDEKS4

Interface web pour l'administration du fonds rotatif (React + Vite),
utilisée par la **Responsable** et les **Autorités** (délégués institutionnels).

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
  api/client.js              -- client HTTP centralisé (token, erreurs)
  context/AuthContext.jsx     -- état de connexion partagé
  components/
    MiseEnPage.jsx            -- barre latérale + zone de contenu
    NotificationsCloche.jsx   -- centre de notifications
    SelecteurPositionCarte.jsx -- carte cliquable (recherche/positionnement, cantons)
    CarteCantons.jsx           -- carte d'ensemble (tous les cantons)
  pages/
    Connexion.jsx
    TableauDeBord.jsx
    Beneficiaires.jsx          -- liste, recherche, création
    Financements.jsx
    Demandes.jsx
    DetailDemande.jsx           -- circuit de validation, décision Responsable
    RemboursementsAttente.jsx   -- remboursements collectifs à valider
    MembresComite.jsx
    Autorites.jsx                -- gestion des comptes délégués
    StatistiquesAutorite.jsx     -- vue d'un compte Autorité connecté
    SituationCantons.jsx
    ConseillerIA.jsx              -- vue Responsable, agrégée par canton
    Parametrage.jsx                -- cantons, domaines, fonctions/habilitations,
                                       programmes, vagues, fonds rotatif, paramètres
    Rapports.jsx                    -- indicateurs, export PDF/Excel, graphiques,
                                       comparaison de périodes, détail nominatif
    Administration.jsx               -- utilisateurs, sauvegardes
```

## Statut

Couverture actuelle : authentification, bénéficiaires, financements,
demandes de financement (circuit de validation complet), remboursements
collectifs, membres du comité, Autorités, Conseiller IA (vue Responsable),
Paramétrage complet, Rapports enrichis, Administration, notifications.

**Non couvert pour l'instant** (backend prêt côté Mobile, pas d'écran
Web dédié) : Groupes MMF et Cotisations.
