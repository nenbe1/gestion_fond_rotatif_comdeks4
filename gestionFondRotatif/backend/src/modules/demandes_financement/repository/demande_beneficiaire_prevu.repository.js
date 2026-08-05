const db = require('../../../config/db');

/**
 * Chaque ligne référence soit un bénéficiaire déjà enregistré (avec
 * son nom/prénom récupérés par jointure), soit un nom saisi librement.
 */
const SELECT_BASE = `
  SELECT
    dbp.id, dbp.demande_financement_id, dbp.beneficiaire_id, dbp.nom_libre,
    u.nom AS beneficiaire_nom, u.prenom AS beneficiaire_prenom
  FROM demande_beneficiaire_prevu dbp
  LEFT JOIN beneficiaire b ON b.id = dbp.beneficiaire_id
  LEFT JOIN utilisateur u ON u.id = b.utilisateur_id
`;

async function findByDemandeId(demandeFinancementId) {
  const [rows] = await db.query(
    `${SELECT_BASE} WHERE dbp.demande_financement_id = ? ORDER BY dbp.id ASC`,
    [demandeFinancementId]
  );
  return rows;
}

/**
 * Insère la liste des bénéficiaires prévus pour une demande. `liste` est
 * un tableau de { beneficiaire_id } ou { nom_libre } (un seul des deux
 * par élément, déjà validé en amont).
 */
async function createMany(demandeFinancementId, liste) {
  for (const item of liste) {
    await db.query(
      'INSERT INTO demande_beneficiaire_prevu (demande_financement_id, beneficiaire_id, nom_libre) VALUES (?, ?, ?)',
      [demandeFinancementId, item.beneficiaire_id || null, item.nom_libre || null]
    );
  }
}

module.exports = { findByDemandeId, createMany };
