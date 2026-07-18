-- =====================================================================
-- SCHEMA MMF - Fonds Rotatif COMDEKS4 (AJEOV Technologies)
-- MySQL 9.1.0
-- =====================================================================
-- Ordre de création respectant les dépendances de clés étrangères :
--   1. utilisateur
--   2. canton, fonction, habilitation, fonction_habilitation, parametre
--   3. beneficiaire, membre_comite, responsable_fond_rotatif
--   4. domaine, vague, fond_rotatif, programme
--   5. demande_financement
--   6. financement
--   7. attribution_financement
--   8. remboursement_beneficiaire
--   9. remboursement_collectif   (doit exister AVANT validation, qui la référence)
--   10. validation
--   11. rapport_genere
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. UTILISATEUR (classe mère)
-- ---------------------------------------------------------------------
CREATE TABLE utilisateur (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code_utilisateur VARCHAR(30) UNIQUE NOT NULL,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  sexe VARCHAR(10) NOT NULL,
  telephone VARCHAR(20) NOT NULL,
  email VARCHAR(150) NULL,
  mot_de_passe VARCHAR(255) NOT NULL,
  photo VARCHAR(255) NULL,
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actif BOOLEAN NOT NULL DEFAULT TRUE
);

-- ---------------------------------------------------------------------
-- CANTON (donnée de référence — module Paramétrage)
-- ---------------------------------------------------------------------
CREATE TABLE canton (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(100) UNIQUE NOT NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL
);

-- ---------------------------------------------------------------------
-- FONCTION (donnée de référence — remplace le texte libre sur
-- membre_comite.fonction, permet de rattacher des habilitations)
-- ---------------------------------------------------------------------
CREATE TABLE fonction (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(30) UNIQUE NOT NULL,   -- PRESIDENT, VICE_PRESIDENT, SECRETAIRE, TRESORIER, COMMISSAIRE, MEMBRE
  libelle VARCHAR(100) NOT NULL
);

-- ---------------------------------------------------------------------
-- HABILITATION (donnée de référence — module Paramétrage)
-- ---------------------------------------------------------------------
CREATE TABLE habilitation (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,   -- ex. VALIDER_DEMANDE, CONSULTER_RAPPORT
  libelle VARCHAR(150) NOT NULL
);

-- ---------------------------------------------------------------------
-- FONCTION_HABILITATION (liaison N..N : quelle fonction a quelle habilitation)
-- ---------------------------------------------------------------------
CREATE TABLE fonction_habilitation (
  fonction_id BIGINT NOT NULL,
  habilitation_id BIGINT NOT NULL,
  PRIMARY KEY (fonction_id, habilitation_id),
  CONSTRAINT fk_fh_fonction FOREIGN KEY (fonction_id) REFERENCES fonction(id),
  CONSTRAINT fk_fh_habilitation FOREIGN KEY (habilitation_id) REFERENCES habilitation(id)
);

-- ---------------------------------------------------------------------
-- PARAMETRE (module Paramétrage — clé/valeur, ex. taux de majoration)
-- ---------------------------------------------------------------------
CREATE TABLE parametre (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  cle VARCHAR(100) UNIQUE NOT NULL,
  valeur VARCHAR(255) NOT NULL,
  description TEXT NULL
);

-- ---------------------------------------------------------------------
-- 2. BENEFICIAIRE (hérite de utilisateur)
-- ---------------------------------------------------------------------
CREATE TABLE beneficiaire (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  utilisateur_id BIGINT UNIQUE NOT NULL,
  age_estime INT NULL,
  activite VARCHAR(150) NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  statut_mmf VARCHAR(30) NOT NULL DEFAULT 'Nouveau',
  CONSTRAINT fk_beneficiaire_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id)
);

-- ---------------------------------------------------------------------
-- MEMBRE_COMITE (hérite de utilisateur)
-- fonction et canton sont maintenant de vraies données de référence
-- (module Paramétrage), plus du texte libre.
-- ---------------------------------------------------------------------
CREATE TABLE membre_comite (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  utilisateur_id BIGINT UNIQUE NOT NULL,
  fonction_id BIGINT NOT NULL,
  canton_id BIGINT NULL,
  date_integration DATE NOT NULL,
  actif BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_membre_comite_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id),
  CONSTRAINT fk_membre_comite_fonction FOREIGN KEY (fonction_id) REFERENCES fonction(id),
  CONSTRAINT fk_membre_comite_canton FOREIGN KEY (canton_id) REFERENCES canton(id)
);

-- ---------------------------------------------------------------------
-- RESPONSABLE_FOND_ROTATIF (hérite de utilisateur)
-- ---------------------------------------------------------------------
CREATE TABLE responsable_fond_rotatif (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  utilisateur_id BIGINT UNIQUE NOT NULL,
  date_nomination DATE NOT NULL,
  actif BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_responsable_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id)
);

-- ---------------------------------------------------------------------
-- 3. DOMAINE
-- ---------------------------------------------------------------------
CREATE TABLE domaine (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(100) UNIQUE NOT NULL,
  description TEXT NULL,
  actif BOOLEAN NOT NULL DEFAULT TRUE
);

-- ---------------------------------------------------------------------
-- VAGUE
-- ---------------------------------------------------------------------
CREATE TABLE vague (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code_vague VARCHAR(30) UNIQUE NOT NULL,
  nom VARCHAR(150) NOT NULL,
  description TEXT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  budget_prevu DECIMAL(15,2) NULL,
  statut VARCHAR(20) NOT NULL,   -- Planifiee, EnCours, Cloturee
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- FOND_ROTATIF
-- ---------------------------------------------------------------------
CREATE TABLE fond_rotatif (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code_fond VARCHAR(30) UNIQUE NOT NULL,
  libelle_fond VARCHAR(150) NOT NULL,
  montant_fond DECIMAL(15,2) NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------
-- PROGRAMME
-- Plusieurs programmes peuvent être actifs simultanément et financer
-- le même fond_rotatif (confirmé par le président). Le code généré de
-- chaque Financement est préfixé par le nom du programme concerné.
-- ---------------------------------------------------------------------
CREATE TABLE programme (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(50) UNIQUE NOT NULL,   -- ex. COMDEKS4
  description TEXT NULL,
  actif BOOLEAN NOT NULL DEFAULT TRUE
);

-- ---------------------------------------------------------------------
-- 4. DEMANDE_FINANCEMENT
-- ---------------------------------------------------------------------
CREATE TABLE demande_financement (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code_demande VARCHAR(30) UNIQUE NOT NULL,
  membre_comite_id BIGINT NOT NULL,
  vague_id BIGINT NOT NULL,
  domaine_id BIGINT NOT NULL,
  objet_demande TEXT NOT NULL,
  resultat_attendu TEXT NULL,
  periode_previsionnelle VARCHAR(100) NULL,
  site_travail VARCHAR(150) NULL,
  nb_femmes_benef INT NOT NULL DEFAULT 0,
  nb_hommes_benef INT NOT NULL DEFAULT 0,
  montant_demande DECIMAL(15,2) NOT NULL,
  co_financement_en_nature DECIMAL(15,2) NULL,   -- apport du canton, en nature -- rassure le donateur
  co_financement_especes DECIMAL(15,2) NULL,     -- apport du canton, en espèces
  statut_global VARCHAR(20) NOT NULL DEFAULT 'EnCours',   -- EnCours, Validee, Rejetee
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_demande_membre_comite FOREIGN KEY (membre_comite_id) REFERENCES membre_comite(id),
  CONSTRAINT fk_demande_vague FOREIGN KEY (vague_id) REFERENCES vague(id),
  CONSTRAINT fk_demande_domaine FOREIGN KEY (domaine_id) REFERENCES domaine(id)
);

-- ---------------------------------------------------------------------
-- 5. FINANCEMENT
-- code_financement : généré automatiquement, format NOM_PROG/AJT/FR/ANNEE/No_Ordre
--   -> NOM_PROG dérivé de programme_id (confirmé par le président)
-- reference_utilisateur : saisie manuelle, usage exact à confirmer
-- ---------------------------------------------------------------------
CREATE TABLE financement (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code_financement VARCHAR(50) UNIQUE NOT NULL,   -- généré : NOM_PROG/AJT/FR/ANNEE/No_Ordre
  reference_utilisateur VARCHAR(100) NULL,        -- saisie libre par l'utilisateur, usage à confirmer
  demande_financement_id BIGINT UNIQUE NOT NULL,   -- UNIQUE = une demande genere au plus 1 financement
  fond_rotatif_id BIGINT NOT NULL,
  programme_id BIGINT NOT NULL,
  responsable_id BIGINT NOT NULL,
  montant_financement DECIMAL(15,2) NOT NULL,
  taux_majoration_applique DECIMAL(5,2) NOT NULL,   -- ex. 10.00 (%) -- frais administratifs, figé au décaissement
  date_decaissement DATE NOT NULL,
  statut VARCHAR(20) NOT NULL DEFAULT 'Actif',   -- Actif, Cloture, TotalementDistribue
  CONSTRAINT fk_financement_demande FOREIGN KEY (demande_financement_id) REFERENCES demande_financement(id),
  CONSTRAINT fk_financement_fond FOREIGN KEY (fond_rotatif_id) REFERENCES fond_rotatif(id),
  CONSTRAINT fk_financement_programme FOREIGN KEY (programme_id) REFERENCES programme(id),
  CONSTRAINT fk_financement_responsable FOREIGN KEY (responsable_id) REFERENCES responsable_fond_rotatif(id)
);

-- ---------------------------------------------------------------------
-- 6. ATTRIBUTION_FINANCEMENT (classe-association Financement <-> Beneficiaire)
-- ---------------------------------------------------------------------
CREATE TABLE attribution_financement (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  financement_id BIGINT NOT NULL,
  beneficiaire_id BIGINT NOT NULL,
  montant_attribue DECIMAL(15,2) NOT NULL,
  date_attribution TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attribution_financement FOREIGN KEY (financement_id) REFERENCES financement(id),
  CONSTRAINT fk_attribution_beneficiaire FOREIGN KEY (beneficiaire_id) REFERENCES beneficiaire(id),
  CONSTRAINT uq_attribution_financement_beneficiaire UNIQUE (financement_id, beneficiaire_id)
);

-- ---------------------------------------------------------------------
-- 7. REMBOURSEMENT_BENEFICIAIRE (niveau individuel, pas de Validation)
-- ---------------------------------------------------------------------
CREATE TABLE remboursement_beneficiaire (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  attribution_financement_id BIGINT NOT NULL,
  montant DECIMAL(15,2) NOT NULL,
  date_versement DATE NOT NULL,
  observation TEXT NULL,
  CONSTRAINT fk_remb_benef_attribution FOREIGN KEY (attribution_financement_id) REFERENCES attribution_financement(id)
);

-- ---------------------------------------------------------------------
-- 8. REMBOURSEMENT_COLLECTIF (niveau collectif, protégé par Validation)
-- Doit exister avant VALIDATION, qui la référence.
-- ---------------------------------------------------------------------
CREATE TABLE remboursement_collectif (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  financement_id BIGINT NOT NULL,
  numero_semaine INT NOT NULL,
  date_prevue DATE NOT NULL,
  date_paiement DATE NULL,
  montant_prevu DECIMAL(15,2) NOT NULL,
  montant_verse DECIMAL(15,2) NULL,
  statut VARCHAR(20) NOT NULL DEFAULT 'EnAttente',   -- EnAttente, Confirme, Rejete, EnRetard
  observation TEXT NULL,
  CONSTRAINT fk_remb_collectif_financement FOREIGN KEY (financement_id) REFERENCES financement(id),
  CONSTRAINT uq_remb_collectif_semaine UNIQUE (financement_id, numero_semaine)
);

-- ---------------------------------------------------------------------
-- 9. VALIDATION (circuit à 3 niveaux, DemandeFinancement OU RemboursementCollectif)
-- ---------------------------------------------------------------------
CREATE TABLE validation (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  demande_financement_id BIGINT NULL,
  remboursement_collectif_id BIGINT NULL,
  niveau VARCHAR(20) NOT NULL,      -- TRESORIER, COMMISSAIRE, PRESIDENT
  ordre SMALLINT NOT NULL,          -- 0, 1, 2
  membre_comite_id BIGINT NOT NULL, -- qui a traité cette étape
  statut VARCHAR(20) NOT NULL DEFAULT 'EnAttente',   -- EnAttente, Approuve, Rejete
  commentaire TEXT NULL,
  date_traitement TIMESTAMP NULL,
  CONSTRAINT fk_validation_demande FOREIGN KEY (demande_financement_id) REFERENCES demande_financement(id),
  CONSTRAINT fk_validation_remb_collectif FOREIGN KEY (remboursement_collectif_id) REFERENCES remboursement_collectif(id),
  CONSTRAINT fk_validation_membre FOREIGN KEY (membre_comite_id) REFERENCES membre_comite(id),
  CONSTRAINT chk_validation_un_seul_objet CHECK (
    (demande_financement_id IS NOT NULL AND remboursement_collectif_id IS NULL)
    OR
    (demande_financement_id IS NULL AND remboursement_collectif_id IS NOT NULL)
  )
);

-- ---------------------------------------------------------------------
-- 10. RAPPORT_GENERE (instantané figé, pas de table Statistique)
-- ---------------------------------------------------------------------
CREATE TABLE rapport_genere (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  date_generation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  periode_debut DATE NOT NULL,
  periode_fin DATE NOT NULL,
  nombre_beneficiaires INT NOT NULL,
  montant_total_finance DECIMAL(15,2) NOT NULL,
  montant_total_rembourse DECIMAL(15,2) NOT NULL,
  taux_remboursement DECIMAL(5,2) NOT NULL,
  nombre_retards INT NOT NULL,
  genere_par BIGINT NOT NULL,
  CONSTRAINT fk_rapport_genere_par FOREIGN KEY (genere_par) REFERENCES responsable_fond_rotatif(id)
);

-- =====================================================================
-- DONNEES DE REFERENCE INITIALES (module Paramétrage)
-- =====================================================================

INSERT INTO fonction (code, libelle) VALUES
  ('PRESIDENT', 'Président du comité'),
  ('VICE_PRESIDENT', 'Vice-président du comité'),
  ('SECRETAIRE', 'Secrétaire du comité'),
  ('TRESORIER', 'Trésorier du comité'),
  ('COMMISSAIRE', 'Commissaire aux comptes'),
  ('MEMBRE', 'Membre simple du comité');

INSERT INTO parametre (cle, valeur, description) VALUES
  ('taux_majoration_remboursement', '10', 'Majoration appliquée sur le remboursement, représentant les frais administratifs (%)');
