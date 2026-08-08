const db = require('../../../config/db');

/**
 * Repository ConseillerIA — enregistre chaque question/réponse pour
 * garder un historique consultable par le bénéficiaire (et exploitable
 * plus tard pour affiner le prompt ou détecter des questions récurrentes).
 */

async function enregistrer({ beneficiaire_id, question, reponse }) {
  const [result] = await db.query(
    `INSERT INTO conseiller_ia_historique (beneficiaire_id, question, reponse)
     VALUES (?, ?, ?)`,
    [beneficiaire_id, question, reponse]
  );
  const [rows] = await db.query(
    'SELECT * FROM conseiller_ia_historique WHERE id = ?',
    [result.insertId]
  );
  return rows[0];
}

async function findByBeneficiaireId(beneficiaireId) {
  const [rows] = await db.query(
    `SELECT * FROM conseiller_ia_historique
     WHERE beneficiaire_id = ?
     ORDER BY date_creation DESC`,
    [beneficiaireId]
  );
  return rows;
}

module.exports = { enregistrer, findByBeneficiaireId };
