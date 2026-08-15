-- =====================================================================
-- MIGRATION — Rappels d'échéance de remboursement (3 jours avant)
-- rappel_envoye évite d'alerter deux fois pour la même échéance si la
-- tâche planifiée tourne plusieurs fois (redémarrage du serveur, etc.)
-- Sûr à exécuter plusieurs fois (vérifie l'existence de la colonne).
-- =====================================================================

SET @colonne_existe = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'remboursement_collectif' AND COLUMN_NAME = 'rappel_envoye'
);
SET @sql = IF(@colonne_existe = 0,
  'ALTER TABLE remboursement_collectif ADD COLUMN rappel_envoye BOOLEAN NOT NULL DEFAULT FALSE',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Deuxième rappel : le jour même de l'échéance (colonne distincte, pour
-- ne jamais confondre "déjà alerté à J-3" et "déjà alerté à J-0").
SET @colonne_jour_j_existe = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'remboursement_collectif' AND COLUMN_NAME = 'rappel_jour_j_envoye'
);
SET @sql2 = IF(@colonne_jour_j_existe = 0,
  'ALTER TABLE remboursement_collectif ADD COLUMN rappel_jour_j_envoye BOOLEAN NOT NULL DEFAULT FALSE',
  'SELECT 1'
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
