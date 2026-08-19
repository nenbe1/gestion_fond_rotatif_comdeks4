-- =====================================================================
-- MIGRATION — Conseiller IA par canton (Web, Responsable)
-- À exécuter une seule fois sur une base déjà existante (celle qui a
-- servi jusqu'ici, avec conseiller_ia_historique déjà créée par
-- migration_conseiller_ia.sql). Si tu recrées la base à partir de
-- schema_mmf.sql, ce script n'est pas nécessaire (déjà inclus dedans).
--
-- Un échange du Conseiller IA porte désormais soit sur un bénéficiaire
-- (Mobile — le bénéficiaire lui-même, ou un membre du comité consultant
-- un bénéficiaire de son canton), soit sur un canton entier (Web —
-- la Responsable), jamais les deux. beneficiaire_id devient donc
-- nullable, canton_id est ajouté, et une contrainte garantit qu'une
-- seule des deux colonnes est renseignée par ligne.
-- =====================================================================

ALTER TABLE conseiller_ia_historique
  MODIFY beneficiaire_id BIGINT NULL,
  ADD COLUMN canton_id BIGINT NULL AFTER beneficiaire_id,
  ADD CONSTRAINT fk_conseiller_ia_canton FOREIGN KEY (canton_id) REFERENCES canton(id),
  ADD CONSTRAINT chk_conseiller_ia_cible CHECK (
    (beneficiaire_id IS NOT NULL AND canton_id IS NULL) OR
    (beneficiaire_id IS NULL AND canton_id IS NOT NULL)
  );
