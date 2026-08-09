-- =====================================================================
-- MIGRATION — Habilitations de base + attribution aux fonctions
-- Sûr à exécuter plusieurs fois (INSERT IGNORE) sur une base déjà
-- existante. Si tu recrées la base à partir de schema_mmf.sql, ces
-- données sont déjà incluses dedans, ce script n'est pas nécessaire.
-- =====================================================================

INSERT IGNORE INTO habilitation (code, libelle) VALUES
  ('GERER_BENEFICIAIRES', 'Enregistrer / modifier / supprimer un bénéficiaire'),
  ('CREER_DEMANDE_FINANCEMENT', 'Proposer une demande de financement'),
  ('GERER_MEMBRES_COMITE', 'Ajouter / modifier un membre du comité'),
  ('GENERER_RAPPORT', 'Générer un nouvel instantané de rapport'),
  ('SUPPRIMER_RAPPORT', 'Supprimer un rapport existant'),
  ('CONFIRMER_REMBOURSEMENT', 'Confirmer ou rejeter un remboursement individuel (double validation)');

INSERT IGNORE INTO fonction_habilitation (fonction_id, habilitation_id)
SELECT f.id, h.id FROM fonction f, habilitation h
WHERE f.code = 'PRESIDENT'
  AND h.code IN ('GERER_BENEFICIAIRES','CREER_DEMANDE_FINANCEMENT','GERER_MEMBRES_COMITE','GENERER_RAPPORT','SUPPRIMER_RAPPORT');

INSERT IGNORE INTO fonction_habilitation (fonction_id, habilitation_id)
SELECT f.id, h.id FROM fonction f, habilitation h
WHERE f.code = 'TRESORIER'
  AND h.code IN ('CREER_DEMANDE_FINANCEMENT','GENERER_RAPPORT','CONFIRMER_REMBOURSEMENT');

INSERT IGNORE INTO fonction_habilitation (fonction_id, habilitation_id)
SELECT f.id, h.id FROM fonction f, habilitation h
WHERE f.code = 'COMMISSAIRE'
  AND h.code IN ('GERER_BENEFICIAIRES','CREER_DEMANDE_FINANCEMENT');
