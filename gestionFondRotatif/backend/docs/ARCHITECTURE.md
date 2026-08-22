# Architecture technique — MMF COMDEKS4

## Vue d'ensemble

```
Client Web (React.js)      ──┐
Client Mobile (React Native) ├──►  API REST (Node.js / Express.js)  ──►  MySQL
```

## Frontend

- **Web** : React.js (Vite), responsive.
- **Mobile** : **React Native (Expo)** — choix tranché et implémenté.
- Communication avec le backend exclusivement via l'API REST (JSON).
- Notifications internes affichées via un centre de notifications (cloche 🔔),
  présent sur les deux plateformes — pas de notifications push externes.

## Backend

- **Node.js + Express.js**.
- Organisation **modulaire par domaine métier** (pas par couche technique globale) :
  chaque module (`beneficiaires`, `financements`, `validations`, `groupes_mmf`,
  `cotisations`, `notifications`, `conseiller_ia`...) possède son propre
  `controller` / `service` / `repository` / `model` / `routes` / `validator`.
- Authentification par **JWT** (expiration 7 jours), mots de passe hashés (`bcrypt`).
- Gestion des rôles au niveau des `middlewares` (`auth.middleware.js`), affinée
  par un **système d'habilitations** configurable (voir plus bas).
- **Tâche planifiée** (`node-cron`) : vérification quotidienne (7h00) des
  échéances de remboursement à venir, pour l'envoi automatique des rappels.
- Génération de fichiers : `pdfkit` (reçus de cotisation, rapports PDF),
  `exceljs` (export Excel des rapports), `multer` (upload des photos de profil).

## Base de données

- **MySQL**.
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
- **Principe général** : pas de suppression définitive des données
  financières ou de référence — on désactive (`actif`) ou on annule
  (`annulee`, `motif_annulation` sur `cotisation`) plutôt que de
  supprimer, pour conserver l'historique et l'auditabilité. **Exception
  connue** : le bénéficiaire (et son compte utilisateur associé) est
  supprimé définitivement (`DELETE`) — à revoir si l'auditabilité doit
  aussi couvrir ce cas avant la mise en production.

## Module Paramétrage

Regroupe les données de référence chargées en amont, modifiables sans
toucher au code, depuis une page Web dédiée à onglets :
- `canton` (localisation, avec positionnement sur carte — recherche par
  nom via OpenStreetMap ou clic direct)
- `domaine` (secteurs d'activité)
- `fonction` (rôles du comité) et `habilitation` (permissions associées) —
  attribuables librement par fonction depuis l'interface
- `programme` (simple activation/désactivation, `actif`) et `vague`
  (avec cycle de vie propre : Planifiée → EnCours → Clôturée)
- `fond_rotatif` (création + alimentation manuelle du solde)
- `parametre` (clé/valeur — verrouillé à une liste de clés réellement
  exploitées par le code, pour éviter les paramètres orphelins)

## Module Groupes MMF & Cotisations

- `groupe_mmf` : groupe de solidarité rattaché à un canton, avec un
  bénéficiaire responsable élu parmi ses membres.
- `adhesion_groupe` : appartenance d'un bénéficiaire à un groupe (un
  bénéficiaire = une seule ligne d'adhésion par groupe).
- `cotisation` : versement individuel d'un bénéficiaire dans son groupe,
  indépendant du circuit de financement du fonds rotatif — reçu PDF généré
  automatiquement, modification (montant/observation) et annulation
  possibles (jamais de suppression).
- Disponible côté Mobile (comité pour l'enregistrement, bénéficiaire pour la
  consultation de ses propres groupes/cotisations) ; pas encore de vue Web
  dédiée à ce jour.

## Module Notifications

- Table `notification`, générée automatiquement par l'application (jamais
  saisie manuellement) sur 4 événements : financement attribué,
  remboursement confirmé, décision sur une demande (à n'importe quelle
  étape du circuit), nouvelle demande soumise.
- Centre de notifications (cloche, badge non-lues, marquer comme lu) sur
  Web et Mobile, alimenté par sondage périodique (pas de websocket).
- Rappels d'échéance de remboursement (J-3 et jour J), générés par la
  tâche planifiée quotidienne, adressés à tout le comité actif du canton
  concerné.

## Conseiller IA

- Service dédié (`modules/conseiller_ia`), pas une entité du modèle de
  données au sens strict (hors historique des échanges).
- S'appuie sur les données individuelles réelles du bénéficiaire
  (`AttributionFinancement`, `RemboursementBeneficiaire`) pour répondre à
  des questions libres, et pour générer une **analyse complète structurée**
  à la demande (résumé, analyse financière, risques identifiés, conseils
  personnalisés) — le tout produit par le modèle Gemini à partir du
  contexte financier réel, jamais inventé.
- Accessible à 3 profils, chacun scopé à ce qu'il a le droit de voir :
  - **Bénéficiaire** (Mobile) : sa propre situation.
  - **Membre du comité** (Mobile) : un bénéficiaire précis, uniquement
    s'il appartient à son propre canton.
  - **Responsable** (Web) : vue agrégée d'un canton entier.

## Sécurité

- Système d'habilitations par fonction, en complément des contrôles de
  rôle existants — jamais en remplacement du circuit de validation à 3
  niveaux, qui reste codé en dur par fonction (Trésorier/Commissaire/
  Président) pour ne jamais être modifiable par erreur depuis l'interface.
- Plusieurs contrôles d'accès manquants ont été identifiés et corrigés en
  cours de développement (ex : création de membre du comité, de
  programme, de vague, de canton, ou alimentation du fonds rotatif —
  initialement sans aucune restriction de rôle) et un bénéficiaire ne
  peut consulter que ses propres cotisations, groupes ou notifications.

## API REST

- Une route par module, préfixée (ex. `/api/beneficiaires`,
  `/api/financements`, `/api/groupes-mmf`, `/api/cotisations`,
  `/api/notifications`, `/api/conseiller-ia`).
- Réponses au format JSON standard, codes HTTP conventionnels.
- Téléchargements de fichiers (PDF, Excel) protégés par le même token JWT
  que le reste de l'API — jamais accessibles par un simple lien direct.

## Déploiement (à préciser en fin de projet)

- Environnement de développement : local (Node.js + MySQL).
- Environnement de production : à définir avec AJEOV Technologies.
