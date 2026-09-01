-- =====================================================================
-- MIGRATION — Pénalités de retard (proposées par le système, validées
-- ou rejetées par la Responsable au cas par cas).
-- =====================================================================

INSERT INTO parametre (cle, valeur, description) VALUES
  ('taux_penalite_retard', '2', 'Pénalité de retard proposée, appliquée par semaine de retard sur la part restant due de chaque bénéficiaire (%)');

CREATE TABLE penalite_retard (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  attribution_financement_id BIGINT NOT NULL,
  semaines_retard INT NOT NULL DEFAULT 1,
  montant_restant_du DECIMAL(15,2) NOT NULL,
  montant_propose DECIMAL(15,2) NOT NULL,
  -- Proposee : calculée par le système, en attente de décision.
  -- Validee : la Responsable a validé, la pénalité s'applique.
  -- Rejetee : la Responsable a rejeté, elle ne s'applique pas.
  -- Tant qu'une ligne reste 'Proposee', le job quotidien la met à jour
  -- (semaines_retard, montants) au lieu d'en créer une nouvelle.
  statut VARCHAR(20) NOT NULL DEFAULT 'Proposee',
  date_calcul TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_decision TIMESTAMP NULL,
  responsable_id BIGINT NULL,
  CONSTRAINT fk_penalite_attribution FOREIGN KEY (attribution_financement_id) REFERENCES attribution_financement(id),
  CONSTRAINT fk_penalite_responsable FOREIGN KEY (responsable_id) REFERENCES responsable_fond_rotatif(id)
);
