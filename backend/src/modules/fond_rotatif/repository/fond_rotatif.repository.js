const db = require('../../../config/db');

/**
 * Repository FondRotatif — accès direct à la table `fond_rotatif`.
 *
 * Représente l'argent disponible. Le solde (`montant_fond`) est stocké
 * directement (pas recalculé à la volée) — décision actée : plus rapide à
 * lire, au prix d'une vigilance stricte sur les transactions SQL à chaque
 * opération qui le modifie (voir modules/financements et
 * modules/remboursements, où chaque débit/crédit est fait dans une
 * transaction pour éviter toute incohérence en cas d'accès concurrent).
 */

/** Retourne tous les fonds rotatifs. */
async function findAll() {
  const [rows] = await db.query('SELECT * FROM fond_rotatif ORDER BY id ASC');
  return rows;
}

/** Retourne un fonds rotatif par son id, ou null. */
async function findById(id) {
  const [rows] = await db.query('SELECT * FROM fond_rotatif WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

/**
 * Crée un nouveau fonds rotatif.
 * @param {{code_fond: string, libelle_fond: string, montant_fond?: number}} data
 * @returns {Promise<Object>} le fonds créé
 */
async function create({ code_fond, libelle_fond, montant_fond }) {
  const [result] = await db.query(
    'INSERT INTO fond_rotatif (code_fond, libelle_fond, montant_fond) VALUES (?, ?, ?)',
    [code_fond, libelle_fond, montant_fond || 0]
  );
  return findById(result.insertId);
}

/**
 * Alimente le fonds (crédit manuel — ex: apport initial d'un programme,
 * hors du circuit RemboursementCollectif qui crédite automatiquement).
 * @param {number} id
 * @param {number} montant
 */
async function alimenter(id, montant) {
  await db.query('UPDATE fond_rotatif SET montant_fond = montant_fond + ? WHERE id = ?', [montant, id]);
  return findById(id);
}

module.exports = { findAll, findById, create, alimenter };
