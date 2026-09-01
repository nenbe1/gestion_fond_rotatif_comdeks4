const db = require('../../../config/db');

const SELECT_BASE = `
  SELECT
    pr.*, f.code_financement,
    u.id AS beneficiaire_utilisateur_id, u.nom AS beneficiaire_nom, u.prenom AS beneficiaire_prenom
  FROM penalite_retard pr
  INNER JOIN attribution_financement af ON af.id = pr.attribution_financement_id
  INNER JOIN financement f ON f.id = af.financement_id
  INNER JOIN beneficiaire b ON b.id = af.beneficiaire_id
  INNER JOIN utilisateur u ON u.id = b.utilisateur_id
`;

async function findById(id) {
  const [rows] = await db.query(`${SELECT_BASE} WHERE pr.id = ?`, [id]);
  return rows[0] || null;
}

/** Pénalités encore à trancher par la Responsable. */
async function findEnAttente() {
  const [rows] = await db.query(`${SELECT_BASE} WHERE pr.statut = 'Proposee' ORDER BY pr.montant_propose DESC`);
  return rows;
}

/**
 * La ligne 'Proposee' déjà existante pour cette attribution, s'il y en a
 * une — le job quotidien met à jour cette ligne plutôt que d'en créer
 * une nouvelle tant qu'elle n'a pas été tranchée par la Responsable.
 */
async function findProposeeParAttribution(attributionFinancementId) {
  const [rows] = await db.query(
    "SELECT * FROM penalite_retard WHERE attribution_financement_id = ? AND statut = 'Proposee'",
    [attributionFinancementId]
  );
  return rows[0] || null;
}

async function create({ attribution_financement_id, semaines_retard, montant_restant_du, montant_propose }) {
  const [resultat] = await db.query(
    `INSERT INTO penalite_retard (attribution_financement_id, semaines_retard, montant_restant_du, montant_propose)
     VALUES (?, ?, ?, ?)`,
    [attribution_financement_id, semaines_retard, montant_restant_du, montant_propose]
  );
  return findById(resultat.insertId);
}

async function mettreAJourProposition(id, { semaines_retard, montant_restant_du, montant_propose }) {
  await db.query(
    `UPDATE penalite_retard
     SET semaines_retard = ?, montant_restant_du = ?, montant_propose = ?, date_calcul = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [semaines_retard, montant_restant_du, montant_propose, id]
  );
  return findById(id);
}

async function decider(id, statut, responsableId) {
  await db.query(
    `UPDATE penalite_retard SET statut = ?, date_decision = CURRENT_TIMESTAMP, responsable_id = ? WHERE id = ?`,
    [statut, responsableId, id]
  );
  return findById(id);
}

module.exports = {
  findById, findEnAttente, findProposeeParAttribution, create, mettreAJourProposition, decider,
};
