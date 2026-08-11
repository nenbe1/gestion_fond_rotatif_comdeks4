const db = require('../../../config/db');

const SELECT_BASE = `
  SELECT
    g.*,
    c.nom AS canton_nom,
    ru.nom AS responsable_nom, ru.prenom AS responsable_prenom,
    (SELECT COUNT(*) FROM adhesion_groupe ag WHERE ag.groupe_mmf_id = g.id AND ag.actif = TRUE) AS nombre_membres
  FROM groupe_mmf g
  INNER JOIN canton c ON c.id = g.canton_id
  LEFT JOIN beneficiaire rb ON rb.id = g.responsable_beneficiaire_id
  LEFT JOIN utilisateur ru ON ru.id = rb.utilisateur_id
`;

async function findAll({ cantonId } = {}) {
  if (cantonId) {
    const [rows] = await db.query(`${SELECT_BASE} WHERE g.canton_id = ? ORDER BY g.date_creation DESC`, [cantonId]);
    return rows;
  }
  const [rows] = await db.query(`${SELECT_BASE} ORDER BY g.date_creation DESC`);
  return rows;
}

async function findById(id) {
  const [rows] = await db.query(`${SELECT_BASE} WHERE g.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function create({ nom, canton_id }) {
  const [result] = await db.query(
    `INSERT INTO groupe_mmf (nom, canton_id, date_creation, actif) VALUES (?, ?, CURDATE(), TRUE)`,
    [nom, canton_id]
  );
  return findById(result.insertId);
}

async function update(id, { nom, responsable_beneficiaire_id, actif }) {
  await db.query(
    `UPDATE groupe_mmf SET nom = ?, responsable_beneficiaire_id = ?, actif = ? WHERE id = ?`,
    [nom, responsable_beneficiaire_id, actif, id]
  );
  return findById(id);
}

// ---------- Adhésions ----------

const SELECT_ADHESION_BASE = `
  SELECT ag.*, u.nom AS beneficiaire_nom, u.prenom AS beneficiaire_prenom
  FROM adhesion_groupe ag
  INNER JOIN beneficiaire b ON b.id = ag.beneficiaire_id
  INNER JOIN utilisateur u ON u.id = b.utilisateur_id
`;

async function findMembresByGroupeId(groupeId, { actifSeulement } = {}) {
  const condition = actifSeulement ? 'AND ag.actif = TRUE' : '';
  const [rows] = await db.query(
    `${SELECT_ADHESION_BASE} WHERE ag.groupe_mmf_id = ? ${condition} ORDER BY ag.date_adhesion ASC`,
    [groupeId]
  );
  return rows;
}

/** Les groupes auxquels appartient un bénéficiaire (sens inverse de findMembresByGroupeId) — utilisé pour "Mes groupes" côté Mobile bénéficiaire. */
async function findGroupesByBeneficiaireId(beneficiaireId) {
  const [rows] = await db.query(
    `SELECT g.*, c.nom AS canton_nom, ag.date_adhesion,
       (SELECT COUNT(*) FROM adhesion_groupe ag2 WHERE ag2.groupe_mmf_id = g.id AND ag2.actif = TRUE) AS nombre_membres
     FROM adhesion_groupe ag
     INNER JOIN groupe_mmf g ON g.id = ag.groupe_mmf_id
     INNER JOIN canton c ON c.id = g.canton_id
     WHERE ag.beneficiaire_id = ? AND ag.actif = TRUE
     ORDER BY ag.date_adhesion DESC`,
    [beneficiaireId]
  );
  return rows;
}

async function findAdhesion(groupeId, beneficiaireId) {
  const [rows] = await db.query(
    `${SELECT_ADHESION_BASE} WHERE ag.groupe_mmf_id = ? AND ag.beneficiaire_id = ? LIMIT 1`,
    [groupeId, beneficiaireId]
  );
  return rows[0] || null;
}

async function findAdhesionById(id) {
  const [rows] = await db.query(`${SELECT_ADHESION_BASE} WHERE ag.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

/**
 * Ajoute un membre. Si le bénéficiaire avait déjà quitté ce groupe
 * (adhésion existante mais actif = FALSE), on réactive l'ancienne ligne
 * plutôt que d'en créer une nouvelle (contrainte UNIQUE sur le couple
 * groupe/bénéficiaire — un seul historique d'adhésion par binôme).
 */
async function ajouterMembre(groupeId, beneficiaireId) {
  const existante = await findAdhesion(groupeId, beneficiaireId);
  if (existante) {
    await db.query(
      'UPDATE adhesion_groupe SET actif = TRUE, date_adhesion = CURDATE() WHERE id = ?',
      [existante.id]
    );
    return findAdhesionById(existante.id);
  }
  const [result] = await db.query(
    `INSERT INTO adhesion_groupe (groupe_mmf_id, beneficiaire_id, date_adhesion, actif) VALUES (?, ?, CURDATE(), TRUE)`,
    [groupeId, beneficiaireId]
  );
  return findAdhesionById(result.insertId);
}

async function retirerMembre(id) {
  await db.query('UPDATE adhesion_groupe SET actif = FALSE WHERE id = ?', [id]);
  return findAdhesionById(id);
}

module.exports = {
  findAll, findById, create, update,
  findMembresByGroupeId, findGroupesByBeneficiaireId, findAdhesion, findAdhesionById, ajouterMembre, retirerMembre,
};
