-- =====================================================================
-- MIGRATION — Système de notifications (centre d'alertes interne)
-- Sûr à exécuter plusieurs fois (CREATE TABLE IF NOT EXISTS).
-- =====================================================================

CREATE TABLE IF NOT EXISTS notification (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  utilisateur_id BIGINT NOT NULL,
  titre VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  lue BOOLEAN NOT NULL DEFAULT FALSE,
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notification_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id)
);
