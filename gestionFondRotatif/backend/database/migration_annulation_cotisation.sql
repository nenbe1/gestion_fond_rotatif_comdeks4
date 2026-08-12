-- =====================================================================
-- MIGRATION — Annulation des cotisations
-- Sûr à exécuter plusieurs fois (vérifie l'existence des colonnes avant
-- de les ajouter). Si tu recrées la base à partir de schema_mmf.sql,
-- ces colonnes y sont déjà incluses, ce script n'est pas nécessaire.
-- =====================================================================

SET @colonne_existe = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotisation' AND COLUMN_NAME = 'annulee'
);
SET @sql = IF(@colonne_existe = 0,
  'ALTER TABLE cotisation ADD COLUMN annulee BOOLEAN NOT NULL DEFAULT FALSE, ADD COLUMN motif_annulation VARCHAR(255) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
