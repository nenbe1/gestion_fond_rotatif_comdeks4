const db = require('../../../config/db');

/**
 * Repository Parametre — accès direct à la table `parametre`.
 *
 * Cœur du module Paramétrage : les valeurs de configuration modifiables
 * sans toucher au code (taux de majoration, seuils...). Rappel de
 * l'exemple qui a motivé ce module : le taux de majoration de 10% sur
 * les remboursements, donné par le président, doit pouvoir changer sans
 * redéploiement.
 */

async function findAll() {
  const [rows] = await db.query('SELECT * FROM parametre ORDER BY cle ASC');
  return rows;
}

async function findById(id) {
  const [rows] = await db.query('SELECT * FROM parametre WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function findByCle(cle) {
  const [rows] = await db.query('SELECT * FROM parametre WHERE cle = ? LIMIT 1', [cle]);
  return rows[0] || null;
}

async function create({ cle, valeur, description }) {
  const [result] = await db.query(
    'INSERT INTO parametre (cle, valeur, description) VALUES (?, ?, ?)',
    [cle, valeur, description || null]
  );
  return findById(result.insertId);
}

async function updateValeur(id, valeur) {
  await db.query('UPDATE parametre SET valeur = ? WHERE id = ?', [valeur, id]);
  return findById(id);
}

module.exports = { findAll, findById, findByCle, create, updateValeur };
