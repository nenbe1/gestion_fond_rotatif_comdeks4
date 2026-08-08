-- =====================================================================
-- MIGRATION — Module Conseiller IA
-- À exécuter une seule fois sur une base déjà existante (celle qui a
-- servi jusqu'ici). Si tu recrées la base à partir de schema_mmf.sql,
-- cette table est déjà incluse dedans, ce script n'est pas nécessaire.
-- =====================================================================

CREATE TABLE IF NOT EXISTS conseiller_ia_historique (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  beneficiaire_id BIGINT NOT NULL,
  question TEXT NOT NULL,
  reponse TEXT NOT NULL,
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_conseiller_ia_beneficiaire FOREIGN KEY (beneficiaire_id) REFERENCES beneficiaire(id)
);
