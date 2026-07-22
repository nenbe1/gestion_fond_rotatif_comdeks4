const db = require('../../../config/db');

// ---------- Remboursement individuel (RemboursementBeneficiaire) ----------

async function findIndividuelById(id) {
  const [rows] = await db.query('SELECT * FROM remboursement_beneficiaire WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function findIndividuelByAttributionId(attributionId) {
  const [rows] = await db.query(
    'SELECT * FROM remboursement_beneficiaire WHERE attribution_financement_id = ? ORDER BY date_versement DESC',
    [attributionId]
  );
  return rows;
}

async function createIndividuel({ attribution_financement_id, montant, date_versement, observation }) {
  const [result] = await db.query(
    `INSERT INTO remboursement_beneficiaire (attribution_financement_id, montant, date_versement, observation)
     VALUES (?, ?, ?, ?)`,
    [attribution_financement_id, montant, date_versement, observation || null]
  );
  return findIndividuelById(result.insertId);
}

// ---------- Remboursement collectif (RemboursementCollectif) ----------

const SELECT_COLLECTIF_BASE = `
  SELECT rc.*, f.code_financement, f.fond_rotatif_id
  FROM remboursement_collectif rc
  INNER JOIN financement f ON f.id = rc.financement_id
`;

async function findCollectifById(id) {
  const [rows] = await db.query(`${SELECT_COLLECTIF_BASE} WHERE rc.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function findCollectifByFinancementId(financementId) {
  const [rows] = await db.query(
    `${SELECT_COLLECTIF_BASE} WHERE rc.financement_id = ? ORDER BY rc.numero_semaine ASC`,
    [financementId]
  );
  return rows;
}

async function createCollectif({ financement_id, numero_semaine, date_prevue, montant_prevu }) {
  const [result] = await db.query(
    `INSERT INTO remboursement_collectif
      (financement_id, numero_semaine, date_prevue, montant_prevu, statut)
     VALUES (?, ?, ?, ?, 'EnAttente')`,
    [financement_id, numero_semaine, date_prevue, montant_prevu]
  );
  return findCollectifById(result.insertId);
}

async function majStatutCollectif(id, statut) {
  await db.query('UPDATE remboursement_collectif SET statut = ? WHERE id = ?', [statut, id]);
}

/** Confirme le paiement (montant réellement versé) et crédite le fonds, dans une transaction. */
async function confirmerPaiementCollectif(connection, id, montantVerse, fondRotatifId) {
  await connection.query(
    `UPDATE remboursement_collectif
     SET statut = 'Confirme', montant_verse = ?, date_paiement = CURDATE()
     WHERE id = ?`,
    [montantVerse, id]
  );
  await connection.query(
    'UPDATE fond_rotatif SET montant_fond = montant_fond + ? WHERE id = ?',
    [montantVerse, fondRotatifId]
  );
}

module.exports = {
  findIndividuelById, findIndividuelByAttributionId, createIndividuel,
  findCollectifById, findCollectifByFinancementId, createCollectif,
  majStatutCollectif, confirmerPaiementCollectif,
};
