const db = require('../../../config/db');

async function findAll() {
  const [rows] = await db.query('SELECT * FROM fonction ORDER BY libelle ASC');
  return rows;
}

async function findById(id) {
  const [rows] = await db.query('SELECT * FROM fonction WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function findByCode(code) {
  const [rows] = await db.query('SELECT * FROM fonction WHERE code = ? LIMIT 1', [code]);
  return rows[0] || null;
}

async function create({ code, libelle }) {
  const [result] = await db.query('INSERT INTO fonction (code, libelle) VALUES (?, ?)', [code, libelle]);
  return findById(result.insertId);
}

async function updateLibelle(id, libelle) {
  await db.query('UPDATE fonction SET libelle = ? WHERE id = ?', [libelle, id]);
  return findById(id);
}

async function supprimer(id) {
  await db.query('DELETE FROM fonction WHERE id = ?', [id]);
}

/** Nombre de membres du comité rattachés à cette fonction — pour bloquer la suppression si elle est utilisée. */
async function compterMembresRattaches(id) {
  const [rows] = await db.query('SELECT COUNT(*) AS total FROM membre_comite WHERE fonction_id = ?', [id]);
  return rows[0].total;
}

// ---------- Habilitations d'une fonction ----------

async function findHabilitationsDeFonction(fonctionId) {
  const [rows] = await db.query(
    `SELECT h.* FROM habilitation h
     INNER JOIN fonction_habilitation fh ON fh.habilitation_id = h.id
     WHERE fh.fonction_id = ?
     ORDER BY h.libelle ASC`,
    [fonctionId]
  );
  return rows;
}

/** Remplace entièrement la liste des habilitations d'une fonction (transaction). */
async function definirHabilitations(fonctionId, habilitationIds) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('DELETE FROM fonction_habilitation WHERE fonction_id = ?', [fonctionId]);
    for (const habilitationId of habilitationIds) {
      await connection.query(
        'INSERT INTO fonction_habilitation (fonction_id, habilitation_id) VALUES (?, ?)',
        [fonctionId, habilitationId]
      );
    }
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = {
  findAll, findById, findByCode, create, updateLibelle, supprimer, compterMembresRattaches,
  findHabilitationsDeFonction, definirHabilitations,
};
