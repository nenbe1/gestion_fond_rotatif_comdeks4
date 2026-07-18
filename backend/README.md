# MMF Backend — Gestion du Fonds Rotatif COMDEKS4

Application web-mobile de gestion du fonds rotatif MMF des femmes et jeunes,
intégrant un conseiller financier IA — AJEOV Technologies.

## Stack technique

- **Backend** : Node.js + Express.js
- **Base de données** : MySQL 9.1.0
- **Frontend** : React.js (web) / React Native ou Flutter (mobile)
- **API** : REST

Voir `docs/ARCHITECTURE.md` pour le détail des choix.

## Structure du projet

```
src/
  modules/
    authentification/
    utilisateurs/
    beneficiaires/
    membres_comite/
    demandes_financement/
    financements/
    attributions/
    remboursements/
    validations/
    vagues/
    domaines/
    programmes/
    fond_rotatif/
    rapports/
    conseiller_ia/
    administration/
    parametrage/          -- données de référence : canton, fonction, habilitation, parametre
    groupes_mmf/           -- V2, mis de côté pour l'instant (confirmé par le président)
    cotisations/            -- V2, fusionné avec remboursements pour l'instant
      controller/
      service/
      repository/
      model/
      routes/
      validator/
  config/
  middlewares/
  utils/
database/
  schema_mmf.sql       -- script de création des tables
  schema_mmf.dbml       -- modèle conceptuel/logique (dbdiagram.io)
docs/
  ARCHITECTURE.md
  dictionnaire_donnees_mmf.xlsx
```

## Installation

```bash
npm install
cp .env.example .env
# renseigner les identifiants MySQL dans .env
mysql -u root -p mmf_comdeks4 < database/schema_mmf.sql
npm run dev
```

## Statut du projet

- [x] Analyse métier et modélisation UML
- [x] Schéma de base de données finalisé
- [ ] Module d'authentification
- [ ] API REST (bénéficiaires, comité, financements)
- [ ] Conseiller IA
- [ ] Frontend Web
- [ ] Frontend Mobile
