-- =====================================================================
-- MIGRATION — Tables manquantes pour les modules groupes_mmf et
-- cotisations (le code de ces deux modules existait déjà et est bien
-- branché dans server.js, mais aucune des tables qu'il utilise n'avait
-- été créée en base — ce script comble ce manque).
--
-- Sûr à exécuter plusieurs fois (CREATE TABLE IF NOT EXISTS). Si tu
-- recrées la base à partir de schema_mmf.sql, ces tables y sont déjà
-- incluses, ce script n'est pas nécessaire dans ce cas.
-- =====================================================================

-- ---------------------------------------------------------------------
-- GROUPE_MMF — un groupe de solidarité, rattaché à un canton, dirigé
-- par un bénéficiaire "responsable" élu parmi ses membres.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS groupe_mmf (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(150) NOT NULL,
  canton_id BIGINT NOT NULL,
  responsable_beneficiaire_id BIGINT NULL,
  date_creation DATE NOT NULL,
  actif BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_groupe_mmf_canton FOREIGN KEY (canton_id) REFERENCES canton(id),
  CONSTRAINT fk_groupe_mmf_responsable FOREIGN KEY (responsable_beneficiaire_id) REFERENCES beneficiaire(id)
);

-- ---------------------------------------------------------------------
-- ADHESION_GROUPE — un bénéficiaire dans un groupe MMF, avec sa date
-- d'entrée. actif=FALSE quand le bénéficiaire quitte le groupe (on garde
-- l'historique plutôt que de supprimer la ligne, même logique que le
-- reste du projet : désactiver plutôt que supprimer).
-- Un même bénéficiaire ne peut avoir qu'UNE seule ligne d'adhésion par
-- groupe (réactivée si besoin, jamais dupliquée) — d'où la contrainte
-- UNIQUE.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS adhesion_groupe (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  groupe_mmf_id BIGINT NOT NULL,
  beneficiaire_id BIGINT NOT NULL,
  date_adhesion DATE NOT NULL,
  actif BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_adhesion_groupe FOREIGN KEY (groupe_mmf_id) REFERENCES groupe_mmf(id),
  CONSTRAINT fk_adhesion_beneficiaire FOREIGN KEY (beneficiaire_id) REFERENCES beneficiaire(id),
  CONSTRAINT uq_adhesion_groupe_beneficiaire UNIQUE (groupe_mmf_id, beneficiaire_id)
);

-- ---------------------------------------------------------------------
-- COTISATION — un versement individuel d'un bénéficiaire dans un groupe
-- MMF, sans périodicité imposée. enregistre_par pointe vers le membre du
-- comité qui a saisi le versement (comme pour les remboursements).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cotisation (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code_cotisation VARCHAR(30) UNIQUE NOT NULL,
  groupe_mmf_id BIGINT NOT NULL,
  beneficiaire_id BIGINT NOT NULL,
  montant DECIMAL(15,2) NOT NULL,
  date_versement DATE NOT NULL,
  observation TEXT NULL,
  enregistre_par BIGINT NOT NULL,
  annulee BOOLEAN NOT NULL DEFAULT FALSE,
  motif_annulation VARCHAR(255) NULL,
  CONSTRAINT fk_cotisation_groupe FOREIGN KEY (groupe_mmf_id) REFERENCES groupe_mmf(id),
  CONSTRAINT fk_cotisation_beneficiaire FOREIGN KEY (beneficiaire_id) REFERENCES beneficiaire(id),
  CONSTRAINT fk_cotisation_membre_comite FOREIGN KEY (enregistre_par) REFERENCES membre_comite(id)
);
