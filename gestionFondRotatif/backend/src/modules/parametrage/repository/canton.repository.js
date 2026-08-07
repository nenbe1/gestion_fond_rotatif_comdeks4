const db = require('../../../config/db');

async function findAll({ actifSeulement } = {}) {
  if (actifSeulement) {
    const [rows] = await db.query('SELECT * FROM canton WHERE actif = TRUE ORDER BY nom ASC');
    return rows;
  }
  const [rows] = await db.query('SELECT * FROM canton ORDER BY nom ASC');
  return rows;
}

async function findById(id) {
  const [rows] = await db.query('SELECT * FROM canton WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function findByNom(nom) {
  const [rows] = await db.query('SELECT * FROM canton WHERE nom = ? LIMIT 1', [nom]);
  return rows[0] || null;
}

async function create({ nom, latitude, longitude }) {
  const [result] = await db.query(
    'INSERT INTO canton (nom, latitude, longitude, actif) VALUES (?, ?, ?, TRUE)',
    [nom, latitude || null, longitude || null]
  );
  return findById(result.insertId);
}

async function update(id, { nom, latitude, longitude }) {
  await db.query(
    'UPDATE canton SET nom = ?, latitude = ?, longitude = ? WHERE id = ?',
    [nom, latitude || null, longitude || null, id]
  );
  return findById(id);
}

async function majActif(id, actif) {
  await db.query('UPDATE canton SET actif = ? WHERE id = ?', [actif, id]);
  return findById(id);
}

module.exports = { findAll, findById, findByNom, create, update, majActif };
