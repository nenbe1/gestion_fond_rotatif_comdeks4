const db = require('../../../config/db');

const SELECT_BASE = `
  SELECT
    mc.id, mc.utilisateur_id, mc.date_integration, mc.actif,
    u.code_utilisateur, u.nom, u.prenom, u.sexe, u.telephone, u.email, u.photo,
    f.id AS fonction_id, f.code AS fonction_code, f.libelle AS fonction_libelle,
    c.id AS canton_id, c.nom AS canton_nom
  FROM membre_comite mc
  INNER JOIN utilisateur u ON u.id = mc.utilisateur_id
  INNER JOIN fonction f ON f.id = mc.fonction_id
  LEFT JOIN canton c ON c.id = mc.canton_id
`;

async function findAll() {
  const [rows] = await db.query(`${SELECT_BASE} ORDER BY u.nom ASC`);
  return rows;
}

async function findById(id) {
  const [rows] = await db.query(`${SELECT_BASE} WHERE mc.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function findByUtilisateurId(utilisateurId) {
  const [rows] = await db.query(`${SELECT_BASE} WHERE mc.utilisateur_id = ? LIMIT 1`, [utilisateurId]);
  return rows[0] || null;
}

/** Tous les membres actifs d'un canton — utilisé pour alerter tout le comité local (ex: rappel d'échéance de remboursement), pas seulement celui qui a soumis une demande précise. */
async function findByCantonId(cantonId) {
  const [rows] = await db.query(`${SELECT_BASE} WHERE mc.canton_id = ? AND mc.actif = TRUE`, [cantonId]);
  return rows;
}

async function create({ utilisateur_id, fonction_id, canton_id }) {
  const [result] = await db.query(
    `INSERT INTO membre_comite (utilisateur_id, fonction_id, canton_id, date_integration, actif)
     VALUES (?, ?, ?, CURDATE(), TRUE)`,
    [utilisateur_id, fonction_id, canton_id]
  );
  return findById(result.insertId);
}

async function update(id, { fonction_id, canton_id, actif }) {
  await db.query(
    `UPDATE membre_comite SET fonction_id = ?, canton_id = ?, actif = ? WHERE id = ?`,
    [fonction_id, canton_id, actif, id]
  );
  return findById(id);
}

async function findAllFonctions() {
  const [rows] = await db.query('SELECT id, code, libelle FROM fonction ORDER BY id ASC');
  return rows;
}

async function findAllCantons() {
  const [rows] = await db.query('SELECT id, nom, latitude, longitude FROM canton ORDER BY nom ASC');
  return rows;
}

/**
 * Crée un nouveau canton. latitude/longitude optionnels — utile sur le
 * terrain quand le nom du canton est connu avant d'avoir pu relever la
 * position GPS exacte (à compléter plus tard via modifierCanton).
 */
async function createCanton({ nom, latitude, longitude }) {
  const [result] = await db.query(
    'INSERT INTO canton (nom, latitude, longitude) VALUES (?, ?, ?)',
    [nom, latitude || null, longitude || null]
  );
  const [rows] = await db.query('SELECT id, nom, latitude, longitude FROM canton WHERE id = ?', [result.insertId]);
  return rows[0];
}

module.exports = {
  findAll, findById, findByUtilisateurId, findByCantonId, create, update,
  findAllFonctions, findAllCantons, createCanton,
};
