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

// CORRECTION : le remboursement démarre maintenant toujours au statut
// 'EnAttente' — c'est confirmerIndividuel (voir plus bas) qui le fait
// passer à 'Confirme', jamais la création elle-même. Double validation :
// le Trésorier enregistre ce qu'il a reçu, puis confirme dans un second
// temps après vérification.
async function createIndividuel({ attribution_financement_id, montant, date_versement, observation }) {
  const [result] = await db.query(
    `INSERT INTO remboursement_beneficiaire (attribution_financement_id, montant, date_versement, observation, statut)
     VALUES (?, ?, ?, ?, 'EnAttente')`,
    [attribution_financement_id, montant, date_versement, observation || null]
  );
  return findIndividuelById(result.insertId);
}

// AJOUT : fait passer un remboursement individuel de 'EnAttente' à
// 'Confirme' (ou 'Rejete' si le Trésorier se rend compte d'une erreur
// de saisie avant confirmation).
async function majStatutIndividuel(id, statut) {
  await db.query('UPDATE remboursement_beneficiaire SET statut = ? WHERE id = ?', [statut, id]);
  return findIndividuelById(id);
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

// AJOUT : liste des remboursements collectifs dont le circuit du comité
// (Trésorier -> Commissaire -> Président) est terminé et qui attendent
// la décision de la Responsable — même logique que pour les demandes de
// financement (EnAttenteResponsable).
async function findCollectifEnAttenteResponsable() {
  const [rows] = await db.query(
    `${SELECT_COLLECTIF_BASE} WHERE rc.statut = 'EnAttenteResponsable' ORDER BY rc.date_prevue ASC`
  );
  return rows;
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

/**
 * Échéances de remboursement collectif tombant exactement dans
 * `joursAvance` jours (0 = aujourd'hui), encore en attente, et pas déjà
 * signalées pour CE type de rappel précis — pour le job de rappels
 * d'échéance. On remonte jusqu'au canton concerné (via demande ->
 * membre_comite) pour savoir qui alerter.
 *
 * `colonneRappel` est toujours une valeur fixe passée en interne par ce
 * fichier (jamais une entrée utilisateur) — l'interpolation directe
 * dans la requête est donc sans risque d'injection ici.
 */
async function findEcheances(joursAvance, colonneRappel) {
  const [rows] = await db.query(
    `SELECT rc.*, f.code_financement, mc.canton_id
     FROM remboursement_collectif rc
     INNER JOIN financement f ON f.id = rc.financement_id
     INNER JOIN demande_financement d ON d.id = f.demande_financement_id
     INNER JOIN membre_comite mc ON mc.id = d.membre_comite_id
     WHERE rc.statut = 'EnAttente' AND rc.${colonneRappel} = FALSE
       AND rc.date_prevue = DATE_ADD(CURDATE(), INTERVAL ? DAY)`,
    [joursAvance]
  );
  return rows;
}

async function marquerRappelEnvoye(id, colonneRappel) {
  await db.query(`UPDATE remboursement_collectif SET ${colonneRappel} = TRUE WHERE id = ?`, [id]);
}

/** Échéances dans 3 jours, pas encore signalées pour ce rappel-là précisément. */
function findEcheancesJMoins3() {
  return findEcheances(3, 'rappel_envoye');
}
function marquerRappelJMoins3Envoye(id) {
  return marquerRappelEnvoye(id, 'rappel_envoye');
}

/** Échéances tombant aujourd'hui, pas encore signalées pour ce rappel-là précisément. */
function findEcheancesJourJ() {
  return findEcheances(0, 'rappel_jour_j_envoye');
}
function marquerRappelJourJEnvoye(id) {
  return marquerRappelEnvoye(id, 'rappel_jour_j_envoye');
}

module.exports = {
  findIndividuelById, findIndividuelByAttributionId, createIndividuel, majStatutIndividuel,
  findCollectifById, findCollectifByFinancementId, createCollectif,
  majStatutCollectif, confirmerPaiementCollectif, findCollectifEnAttenteResponsable,
  findEcheancesJMoins3, marquerRappelJMoins3Envoye, findEcheancesJourJ, marquerRappelJourJEnvoye,
};
