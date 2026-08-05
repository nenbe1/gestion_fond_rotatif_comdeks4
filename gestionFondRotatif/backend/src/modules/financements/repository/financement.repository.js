const db = require('../../../config/db');

const SELECT_BASE = `
  SELECT
    f.*,
    d.code_demande, d.montant_demande,
    p.nom AS programme_nom,
    fr.libelle_fond AS fond_libelle,
    mc.canton_id, c.nom AS canton_nom
  FROM financement f
  INNER JOIN demande_financement d ON d.id = f.demande_financement_id
  INNER JOIN programme p ON p.id = f.programme_id
  INNER JOIN fond_rotatif fr ON fr.id = f.fond_rotatif_id
  INNER JOIN membre_comite mc ON mc.id = d.membre_comite_id
  LEFT JOIN canton c ON c.id = mc.canton_id
`;

async function findAll({ cantonId } = {}) {
  if (cantonId) {
    const [rows] = await db.query(`${SELECT_BASE} WHERE mc.canton_id = ? ORDER BY f.date_decaissement DESC`, [cantonId]);
    return rows;
  }
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

async function debiterFond(connection, fondRotatifId, montant) {
  await connection.query(
    'UPDATE fond_rotatif SET montant_fond = montant_fond - ? WHERE id = ?',
    [montant, fondRotatifId]
  );
}

async function crediterFond(connection, fondRotatifId, montant) {
  await connection.query(
    'UPDATE fond_rotatif SET montant_fond = montant_fond + ? WHERE id = ?',
    [montant, fondRotatifId]
  );
}

async function compterAttributions(financementId) {
  const [rows] = await db.query(
    'SELECT COUNT(*) AS total FROM attribution_financement WHERE financement_id = ?',
    [financementId]
  );
  return rows[0].total;
}

// CORRECTION : modifier() couvre maintenant programme_id, fond_rotatif_id
// ET montant_financement en une seule requête (avant, seul le programme
// était modifiable). Toujours appelée via une connexion de transaction
// depuis le service quand fond/montant changent, pour rester cohérente
// avec le débit/crédit du fonds.
async function modifier(executeur, id, { programme_id, fond_rotatif_id, montant_financement }) {
  await executeur.query(
    'UPDATE financement SET programme_id = ?, fond_rotatif_id = ?, montant_financement = ? WHERE id = ?',
    [programme_id, fond_rotatif_id, montant_financement, id]
  );
  return findById(id);
}

async function supprimer(connection, id) {
  await connection.query('DELETE FROM financement WHERE id = ?', [id]);
}

async function trouverCantonId(financementId) {
  const [rows] = await db.query(
    `SELECT mc.canton_id
     FROM financement f
     INNER JOIN demande_financement d ON d.id = f.demande_financement_id
     INNER JOIN membre_comite mc ON mc.id = d.membre_comite_id
     WHERE f.id = ?`,
    [financementId]
  );
  return rows[0]?.canton_id ?? null;
}

module.exports = {
  findAll, findById, findByDemandeId, create,
  compterFinancementsAnnee, getTauxMajoration, debiterFond, crediterFond,
  compterAttributions, modifier, supprimer, trouverCantonId,
};
