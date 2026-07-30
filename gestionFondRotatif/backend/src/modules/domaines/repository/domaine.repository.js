const db = require('../../../config/db');

/**
 * Repository Domaine — accès direct à la table `domaine`.
 *
 * Un domaine représente un secteur d'activité financé par le fonds rotatif
 * (Environnement, Agriculture, Élevage, Pêche, Petit commerce, GHM). C'est
 * une donnée de référence chargée en amont (voir schema_mmf.sql), modifiable
 * sans toucher au code — d'où sa place dans le module de Paramétrage.
 */

/**
 * Retourne tous les domaines, triés par nom.
 * @returns {Promise<Array<Object>>} lignes brutes de la table `domaine`
 */
async function findAll() {
  const [rows] = await db.query('SELECT * FROM domaine ORDER BY nom ASC');
  return rows;
}

/**
 * Retourne un domaine par son id.
 * @param {number} id
 * @returns {Promise<Object|null>} la ligne, ou null si introuvable
 */
async function findById(id) {
  const [rows] = await db.query('SELECT * FROM domaine WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

/**
 * Crée un nouveau domaine (actif par défaut).
 * Utilisé si un nouveau secteur d'activité doit être ajouté après le
 * lancement (ex: le président confirme un 7e domaine) — sans avoir à
 * modifier le script SQL initial.
 * @param {{nom: string, description?: string}} data
 * @returns {Promise<Object>} le domaine créé
 */
async function create({ nom, description }) {
  const [result] = await db.query(
    'INSERT INTO domaine (nom, description, actif) VALUES (?, ?, TRUE)',
    [nom, description || null]
  );
  return findById(result.insertId);
}

module.exports = { findAll, findById, create };
