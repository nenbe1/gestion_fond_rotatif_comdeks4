const db = require('../../../config/db');

async function findAll() {
  const [rows] = await db.query('SELECT * FROM habilitation ORDER BY libelle ASC');
  return rows;
}

async function findById(id) {
  const [rows] = await db.query('SELECT * FROM habilitation WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function findByCode(code) {
  const [rows] = await db.query('SELECT * FROM habilitation WHERE code = ? LIMIT 1', [code]);
  return rows[0] || null;
}

async function create({ code, libelle }) {
  const [result] = await db.query('INSERT INTO habilitation (code, libelle) VALUES (?, ?)', [code, libelle]);
  return findById(result.insertId);
}

async function supprimer(id) {
  await db.query('DELETE FROM fonction_habilitation WHERE habilitation_id = ?', [id]);
  await db.query('DELETE FROM habilitation WHERE id = ?', [id]);
}

module.exports = { findAll, findById, findByCode, create, supprimer };
