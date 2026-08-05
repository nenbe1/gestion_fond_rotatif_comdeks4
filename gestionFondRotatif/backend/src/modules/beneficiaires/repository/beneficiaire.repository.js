const db = require('../../../config/db');

/**
 * Repository Beneficiaire — Beneficiaire hérite de Utilisateur (utilisateur_id).
 * Les requêtes de lecture joignent systématiquement les deux tables pour
 * retourner un objet complet (nom, prenom, telephone... + age_estime, activite...).
 */

const SELECT_BASE = `
  SELECT
    b.id, b.utilisateur_id, b.canton_id, c.nom AS canton_nom, b.age_estime, b.activite,
    b.latitude, b.longitude, b.statut_mmf,
    u.code_utilisateur, u.nom, u.prenom, u.sexe, u.telephone,
    u.email, u.photo, u.date_creation, u.actif
  FROM beneficiaire b
  INNER JOIN utilisateur u ON u.id = b.utilisateur_id
  LEFT JOIN canton c ON c.id = b.canton_id
`;

async function findAll({ cantonId } = {}) {
  if (cantonId) {
    const [rows] = await db.query(`${SELECT_BASE} WHERE b.canton_id = ? ORDER BY u.date_creation DESC`, [cantonId]);
    return rows;
  }
  const [rows] = await db.query(`${SELECT_BASE} ORDER BY u.date_creation DESC`);
  return rows;
}

async function findById(id) {
  const [rows] = await db.query(`${SELECT_BASE} WHERE b.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function findByUtilisateurId(utilisateurId) {
  const [rows] = await db.query(`${SELECT_BASE} WHERE b.utilisateur_id = ? LIMIT 1`, [utilisateurId]);
  return rows[0] || null;
}

async function create({ utilisateur_id, canton_id, age_estime, activite, latitude, longitude }) {
  const [result] = await db.query(
    `INSERT INTO beneficiaire
      (utilisateur_id, canton_id, age_estime, activite, latitude, longitude, statut_mmf)
     VALUES (?, ?, ?, ?, ?, ?, 'Nouveau')`,
    [utilisateur_id, canton_id || null, age_estime || null, activite || null, latitude || null, longitude || null]
  );
  return findById(result.insertId);
}

async function update(id, { age_estime, activite, latitude, longitude }) {
  await db.query(
    `UPDATE beneficiaire
     SET age_estime = ?, activite = ?, latitude = ?, longitude = ?
     WHERE id = ?`,
    [age_estime || null, activite || null, latitude || null, longitude || null, id]
  );
  return findById(id);
}

async function mettreAJourStatutMMF(id, statut) {
  await db.query('UPDATE beneficiaire SET statut_mmf = ? WHERE id = ?', [statut, id]);
}

/** Pour recalculerStatutMMF : somme attribuée vs somme remboursée par le bénéficiaire. */
async function calculerSituationFinanciere(id) {
  const [rows] = await db.query(
    `SELECT
       COUNT(DISTINCT af.id) AS nb_attributions,
       COALESCE(SUM(af.montant_attribue), 0) AS total_attribue,
       COALESCE((
         SELECT SUM(rb.montant)
         FROM remboursement_beneficiaire rb
         INNER JOIN attribution_financement af2 ON af2.id = rb.attribution_financement_id
         WHERE af2.beneficiaire_id = ?
       ), 0) AS total_rembourse
     FROM attribution_financement af
     WHERE af.beneficiaire_id = ?`,
    [id, id]
  );
  return rows[0];
}

module.exports = {
  findAll,
  findById,
  findByUtilisateurId,
  create,
  update,
  mettreAJourStatutMMF,
  calculerSituationFinanciere,
};
