# Architecture technique — MMF COMDEKS4

## Vue d'ensemble

```
Client Web (React.js)  ──┐
                          ├──►  API REST (Node.js / Express.js)  ──►  MySQL 9.1.0
Client Mobile (RN/React Native)┘
```

## Frontend

- **Web** : React.js, responsive.
- **Mobile** : React Native.
- Communication avec le backend exclusivement via l'API REST (JSON).

## Backend

- **Node.js + Express.js**.
- Organisation **modulaire par domaine métier** (pas par couche technique globale) :
  chaque module (`beneficiaires`, `financements`, `validations`...) possède son propre
  `controller` / `service` / `repository` / `model` / `routes` / `validator`.
- Authentification par **JWT**, mots de passe hashés (`bcrypt`).
- Gestion des rôles/permissions au niveau des `middlewares`.

## Base de données

- **MySQL 9.1.0** (WampServer en développement).
- Schéma détaillé : voir `database/schema_mmf.sql`, `database/schema_mmf.dbml`
  et `docs/dictionnaire_donnees_mmf.xlsx`.
- Principe directeur : deux niveaux de gestion financière strictement séparés :
  - **Niveau collectif** (comité ↔ fonds) : protégé par un circuit de validation
    à 3 niveaux (Trésorier → Commissaire aux comptes → Président du comité).
  - **Niveau individuel** (comité ↔ bénéficiaire) : gestion libre du comité,
    sans validation formelle, mais tracé pour les besoins du conseiller IA.
- **Règle métier confirmée par le président** : remboursement hebdomadaire,
  avec une majoration de 10% (frais administratifs), figée par financement
  au moment du décaissement (`financement.taux_majoration_applique`) — le
  taux de référence reste modifiable via le module Paramétrage
  (`parametre.cle = 'taux_majoration_remboursement'`), sans affecter les
  prêts déjà en cours si le taux change.

## Module Paramétrage

Regroupe les données de référence chargées en amont, modifiables sans
toucher au code :
- `canton` (localisation)
- `fonction` (rôles du comité) et `habilitation` (permissions associées)
- `parametre` (clé/valeur — taux, seuils...)
- `domaine`, `programme` (déjà existants, même logique)


## Conseiller IA

- Service dédié (`modules/conseiller_ia`), pas une entité du modèle de données.
- S'appuie sur les données individuelles du bénéficiaire
  (`AttributionFinancement`, `RemboursementBeneficiaire`) pour répondre à des
  questions comme : niveau de remboursement, capacité d'emprunt, historique.

## API REST

- Une route par module, préfixée (ex. `/api/beneficiaires`, `/api/financements`).
- Réponses au format JSON standard, codes HTTP conventionnels.

## Déploiement (à préciser en fin de projet)

- Environnement de développement : WampServer (local).
- Environnement de production : à définir avec AJEOV Technologies.
