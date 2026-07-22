const db = require('../../../config/db');

const SELECT_BASE = `
  SELECT
    af.*, b.utilisateur_id AS beneficiaire_utilisateur_id,
    u.nom AS beneficiaire_nom, u.prenom AS beneficiaire_prenom,
    f.montant_financement, f.code_financement
  FROM attribution_financement af
  INNER JOIN beneficiaire b ON b.id = af.beneficiaire_id
  INNER JOIN utilisateur u ON u.id = b.utilisateur_id
  INNER JOIN financement f ON f.id = af.financement_id
`;

async function findByFinancementId(financementId) {
  const [rows] = await db.query(`${SELECT_BASE} WHERE af.financement_id = ? ORDER BY af.date_attribution ASC`, [financementId]);
  return rows;
}

async function findById(id) {
  const [rows] = await db.query(`${SELECT_BASE} WHERE af.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function findByFinancementEtBeneficiaire(financementId, beneficiaireId) {
  const [rows] = await db.query(
    `${SELECT_BASE} WHERE af.financement_id = ? AND af.beneficiaire_id = ? LIMIT 1`,
    [financementId, beneficiaireId]
  );
  return rows[0] || null;
}

/** Somme déjà attribuée sur un financement, pour vérifier qu'on ne dépasse pas le montant total. */
async function sommeAttribueePourFinancement(financementId) {
  const [rows] = await db.query(
    'SELECT COALESCE(SUM(montant_attribue), 0) AS total FROM attribution_financement WHERE financement_id = ?',
    [financementId]
  );
  return Number(rows[0].total);
}

async function create({ financement_id, beneficiaire_id, montant_attribue }) {
  const [result] = await db.query(
    `INSERT INTO attribution_financement (financement_id, beneficiaire_id, montant_attribue, date_attribution)
     VALUES (?, ?, ?, NOW())`,
    [financement_id, beneficiaire_id, montant_attribue]
  );
  return findById(result.insertId);
}

/** Total remboursé pour une attribution (via remboursement_beneficiaire liés). */
async function sommeRembourseePourAttribution(attributionId) {
  const [rows] = await db.query(
    'SELECT COALESCE(SUM(montant), 0) AS total FROM remboursement_beneficiaire WHERE attribution_financement_id = ?',
    [attributionId]
  );
  return Number(rows[0].total);
}

module.exports = {
  findByFinancementId, findById, findByFinancementEtBeneficiaire,
  sommeAttribueePourFinancement, create, sommeRembourseePourAttribution,
};
