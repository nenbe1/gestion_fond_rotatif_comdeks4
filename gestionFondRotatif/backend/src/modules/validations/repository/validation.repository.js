const db = require('../../../config/db');

const NIVEAUX = ['TRESORIER', 'COMMISSAIRE', 'PRESIDENT'];

/**
 * Crée les 3 lignes Validation en attente pour une DemandeFinancement
 * ou un RemboursementCollectif (un seul des deux FK rempli, jamais les deux).
 */
async function creerCircuitPourDemande(demandeFinancementId) {
  return creerCircuit({ demande_financement_id: demandeFinancementId });
}

async function creerCircuitPourRemboursementCollectif(remboursementCollectifId) {
  return creerCircuit({ remboursement_collectif_id: remboursementCollectifId });
}

async function creerCircuit({ demande_financement_id = null, remboursement_collectif_id = null }) {
  const lignes = [];
  for (let ordre = 0; ordre < NIVEAUX.length; ordre++) {
    const [result] = await db.query(
      `INSERT INTO validation
        (demande_financement_id, remboursement_collectif_id, niveau, ordre, statut)
       VALUES (?, ?, ?, ?, 'EnAttente')`,
      [demande_financement_id, remboursement_collectif_id, NIVEAUX[ordre], ordre]
    );
    lignes.push(result.insertId);
  }
  return lignes;
}

async function findByDemandeId(demandeFinancementId) {
  const [rows] = await db.query(
    'SELECT * FROM validation WHERE demande_financement_id = ? ORDER BY ordre ASC',
    [demandeFinancementId]
  );
  return rows;
}

async function findByRemboursementCollectifId(remboursementCollectifId) {
  const [rows] = await db.query(
    'SELECT * FROM validation WHERE remboursement_collectif_id = ? ORDER BY ordre ASC',
    [remboursementCollectifId]
  );
  return rows;
}

async function findById(id) {
  const [rows] = await db.query('SELECT * FROM validation WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function traiter(id, { statut, commentaire, membre_comite_id }) {
  await db.query(
    `UPDATE validation
     SET statut = ?, commentaire = ?, membre_comite_id = ?, date_traitement = NOW()
     WHERE id = ?`,
    [statut, commentaire || null, membre_comite_id, id]
  );
  return findById(id);
}

module.exports = {
  NIVEAUX,
  creerCircuitPourDemande,
  creerCircuitPourRemboursementCollectif,
  findByDemandeId,
  findByRemboursementCollectifId,
  findById,
  traiter,
};
