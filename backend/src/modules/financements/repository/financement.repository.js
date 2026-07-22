const db = require('../../../config/db');

const SELECT_BASE = `
  SELECT
    f.*,
    d.code_demande, d.montant_demande,
    p.nom AS programme_nom,
    fr.libelle_fond AS fond_libelle
  FROM financement f
  INNER JOIN demande_financement d ON d.id = f.demande_financement_id
  INNER JOIN programme p ON p.id = f.programme_id
  INNER JOIN fond_rotatif fr ON fr.id = f.fond_rotatif_id
`;

async function findAll() {
  const [rows] = await db.query(`${SELECT_BASE} ORDER BY f.date_decaissement DESC`);
  return rows;
}

async function findById(id) {
  const [rows] = await db.query(`${SELECT_BASE} WHERE f.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function findByDemandeId(demandeId) {
  const [rows] = await db.query(`${SELECT_BASE} WHERE f.demande_financement_id = ? LIMIT 1`, [demandeId]);
  return rows[0] || null;
}

/** Compte les financements déjà créés cette année, pour le numéro d'ordre du code. */
async function compterFinancementsAnnee(annee) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS total FROM financement WHERE YEAR(date_decaissement) = ?`,
    [annee]
  );
  return rows[0].total;
}

async function getTauxMajoration() {
  const [rows] = await db.query(
    `SELECT valeur FROM parametre WHERE cle = 'taux_majoration_remboursement' LIMIT 1`
  );
  return rows[0] ? Number(rows[0].valeur) : 0;
}

async function create({
  code_financement, demande_financement_id, fond_rotatif_id, programme_id,
  responsable_id, montant_financement, taux_majoration_applique,
}) {
  const [result] = await db.query(
    `INSERT INTO financement
      (code_financement, demande_financement_id, fond_rotatif_id, programme_id,
       responsable_id, montant_financement, date_decaissement, statut, taux_majoration_applique)
     VALUES (?, ?, ?, ?, ?, ?, CURDATE(), 'Actif', ?)`,
    [
      code_financement, demande_financement_id, fond_rotatif_id, programme_id,
      responsable_id, montant_financement, taux_majoration_applique,
    ]
  );
  return findById(result.insertId);
}

/** Débite le fonds rotatif du montant décaissé (dans une transaction, voir service). */
async function debiterFond(connection, fondRotatifId, montant) {
  await connection.query(
    'UPDATE fond_rotatif SET montant_fond = montant_fond - ? WHERE id = ?',
    [montant, fondRotatifId]
  );
}

module.exports = {
  findAll, findById, findByDemandeId, create,
  compterFinancementsAnnee, getTauxMajoration, debiterFond,
};
