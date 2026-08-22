# MMF Backend — Gestion du Fonds Rotatif COMDEKS4

Application web-mobile de gestion du fonds rotatif MMF des femmes et jeunes,
intégrant un conseiller financier IA — COMDEKS4 / AJEOV Technologies.

## Stack technique

- **Backend** : Node.js + Express.js
- **Base de données** : MySQL
- **Frontend** : React.js (Web) / React Native + Expo (Mobile)
- **API** : REST
- **IA** : Google Gemini (conseiller financier)
- Autres librairies clés : `jsonwebtoken` + `bcrypt` (authentification),
  `node-cron` (tâches planifiées), `pdfkit` (PDF), `exceljs` (Excel),
  `multer` (upload de photos)

Voir `docs/ARCHITECTURE.md` pour le détail des choix.

## Structure du projet

```
src/
  modules/
    authentification/
    utilisateurs/
    beneficiaires/          -- profil, photo, géolocalisation
    membres_comite/
    demandes_financement/
    financements/
    attributions/
    remboursements/          -- individuel + collectif, rappels d'échéance
    validations/              -- circuit à 3 niveaux (Trésorier/Commissaire/Président)
    vagues/
    domaines/
    programmes/
    fond_rotatif/
    rapports/                 -- indicateurs, export PDF/Excel, graphiques
    conseiller_ia/            -- bénéficiaire, comité (par canton), Responsable (par canton)
    notifications/            -- centre de notifications interne
    groupes_mmf/               -- groupes de solidarité entre bénéficiaires
    cotisations/                -- versements dans un groupe, indépendants du fonds rotatif
    administration/
    parametrage/                -- données de référence : canton, domaine, fonction,
                                    habilitation, programme, vague, fond_rotatif, parametre
      controller/
      service/
      repository/
      model/
      routes/
      validator/
  jobs/
    rappelsEcheance.js          -- tâche planifiée quotidienne (7h00)
  config/
  middlewares/
database/
  schema_mmf.sql        -- script de création complet (installation neuve)
  schema_mmf.dbml         -- modèle conceptuel/logique (dbdiagram.io)
  migration_*.sql           -- migrations incrémentales (base déjà existante)
docs/
  ARCHITECTURE.md
  dictionnaire_donnees_mmf.xlsx
```

## Installation

**Base neuve :**
```bash
npm install
cp .env.example .env
# renseigner les identifiants MySQL et la clé GEMINI_API_KEY dans .env
mysql -u root -p gestion_fond_rotatif < database/schema_mmf.sql
npm run dev
```

**Base déjà existante (mise à jour)** — exécuter chaque `migration_*.sql`
présent dans `database/` un par un (chacun est sûr à rejouer plusieurs fois).

## Statut du projet

- [x] Analyse métier et modélisation
- [x] Schéma de base de données
- [x] Authentification (JWT, rôles, habilitations par fonction)
- [x] API REST — bénéficiaires, comité, financements, remboursements
- [x] Circuit de validation à 3 niveaux
- [x] Groupes MMF & Cotisations (reçus PDF, annulation/modification)
- [x] Conseiller IA (bénéficiaire, comité, Responsable)
- [x] Système de notifications + rappels d'échéance automatiques
- [x] Rapports (PDF, Excel, graphiques, comparaison de périodes)
- [x] Frontend Web
- [x] Frontend Mobile
- [ ] Vue Web dédiée Groupes MMF/Cotisations (Mobile uniquement à ce jour)
- [ ] Mode hors-ligne (Mobile)
