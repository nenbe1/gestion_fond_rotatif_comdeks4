-- =====================================================================
-- MIGRATION — co_financement_en_nature : DECIMAL -> VARCHAR
-- L'appli mobile envoie une description texte (ex: "Terrain disponible")
-- pour ce champ, pas un montant. La colonne était en DECIMAL(15,2) et
-- rejetait ces envois. Sûr à exécuter sur une base déjà existante :
-- MySQL convertit les valeurs déjà présentes (NULL ou nombres) en texte.
-- Si tu recrées la base à partir de schema_mmf.sql, cette migration
-- n'est pas nécessaire (déjà inclus dedans).
-- =====================================================================

ALTER TABLE demande_financement
  MODIFY COLUMN co_financement_en_nature VARCHAR(255) NULL;
