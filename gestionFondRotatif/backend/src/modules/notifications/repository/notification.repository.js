const db = require('../../../config/db');

async function create(utilisateurId, titre, message) {
  const [result] = await db.query(
    'INSERT INTO notification (utilisateur_id, titre, message) VALUES (?, ?, ?)',
    [utilisateurId, titre, message]
  );
  const [rows] = await db.query('SELECT * FROM notification WHERE id = ?', [result.insertId]);
  return rows[0];
}

/** Les 50 plus récentes du destinataire — un centre de notifications n'a pas besoin d'un historique illimité à l'écran. */
async function findByUtilisateurId(utilisateurId) {
  const [rows] = await db.query(
    'SELECT * FROM notification WHERE utilisateur_id = ? ORDER BY date_creation DESC LIMIT 50',
    [utilisateurId]
  );
  return rows;
}

async function compterNonLues(utilisateurId) {
  const [rows] = await db.query(
    'SELECT COUNT(*) AS total FROM notification WHERE utilisateur_id = ? AND lue = FALSE',
    [utilisateurId]
  );
  return rows[0].total;
}

/** Marque une notification lue — uniquement si elle appartient bien à ce destinataire (vérifié dans la requête elle-même, pas après coup). */
async function marquerLue(id, utilisateurId) {
  await db.query('UPDATE notification SET lue = TRUE WHERE id = ? AND utilisateur_id = ?', [id, utilisateurId]);
}

async function marquerToutesLues(utilisateurId) {
  await db.query('UPDATE notification SET lue = TRUE WHERE utilisateur_id = ? AND lue = FALSE', [utilisateurId]);
}

/** Résout le membre du comité qui a soumis une demande — pour lui notifier la décision prise dessus. */
async function trouverSoumissionnaireDemande(demandeId) {
  const [rows] = await db.query(
    `SELECT mc.utilisateur_id
     FROM demande_financement d
     INNER JOIN membre_comite mc ON mc.id = d.membre_comite_id
     WHERE d.id = ?`,
    [demandeId]
  );
  return rows[0]?.utilisateur_id ?? null;
}

/** Tous les comptes Responsable — pour les alerter d'une nouvelle demande à traiter. */
async function trouverTousLesResponsables() {
  const [rows] = await db.query('SELECT utilisateur_id FROM responsable_fond_rotatif');
  return rows.map((r) => r.utilisateur_id);
}

module.exports = {
  create, findByUtilisateurId, compterNonLues, marquerLue, marquerToutesLues,
  trouverSoumissionnaireDemande, trouverTousLesResponsables,
};
