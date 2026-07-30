const db = require('../../../config/db');

/**
 * Repository Programme — accès direct à la table `programme`.
 *
 * Un programme est un bailleur/dispositif qui finance le fonds rotatif
 * (ex: COMDEKS4). Confirmé par le président : plusieurs programmes peuvent
 * être actifs simultanément et financer le même fonds — d'où une table à
 * part entière plutôt qu'un simple champ texte sur FondRotatif. Le nom du
 * programme sert aussi de préfixe au code généré de chaque Financement
 * (format NOM_PROG/AJT/FR/ANNEE/No_Ordre).
 */

/** Retourne tous les programmes, triés par nom. */
async function findAll() {
  const [rows] = await db.query('SELECT * FROM programme ORDER BY nom ASC');
  return rows;
}

/** Retourne un programme par son id, ou null. */
async function findById(id) {
  const [rows] = await db.query('SELECT * FROM programme WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

/**
 * Crée un nouveau programme (actif par défaut).
 * @param {{nom: string, description?: string}} data
 * @returns {Promise<Object>} le programme créé
 */
async function create({ nom, description }) {
  const [result] = await db.query(
    'INSERT INTO programme (nom, description, actif) VALUES (?, ?, TRUE)',
    [nom, description || null]
  );
  return findById(result.insertId);
}

module.exports = { findAll, findById, create };
