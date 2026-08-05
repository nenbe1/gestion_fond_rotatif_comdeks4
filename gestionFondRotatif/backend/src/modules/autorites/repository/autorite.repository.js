const db = require('../../../config/db');

/**
 * Repository Autorite — Autorite hérite de Utilisateur (utilisateur_id),
 * même schéma d'héritage que Beneficiaire/MembreComite/ResponsableFondRotatif.
 */

const SELECT_BASE = `
  SELECT
    a.id, a.utilisateur_id, a.fonction, a.type_critere,
    a.domaine_id, d.nom AS domaine_nom, a.valeur_critere, a.actif,
    u.code_utilisateur, u.nom, u.prenom, u.sexe, u.telephone,
    u.email, u.photo, u.date_creation
  FROM autorite a
  INNER JOIN utilisateur u ON u.id = a.utilisateur_id
  LEFT JOIN domaine d ON d.id = a.domaine_id
`;

async function findAll() {
  const [rows] = await db.query(`${SELECT_BASE} ORDER BY u.date_creation DESC`);
  return rows;
}

async function findById(id) {
  const [rows] = await db.query(`${SELECT_BASE} WHERE a.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function findByUtilisateurId(utilisateurId) {
  const [rows] = await db.query(`${SELECT_BASE} WHERE a.utilisateur_id = ? LIMIT 1`, [utilisateurId]);
  return rows[0] || null;
}

async function create({ utilisateur_id, fonction, type_critere, domaine_id, valeur_critere }) {
  const [result] = await db.query(
    `INSERT INTO autorite (utilisateur_id, fonction, type_critere, domaine_id, valeur_critere)
     VALUES (?, ?, ?, ?, ?)`,
    [utilisateur_id, fonction, type_critere, domaine_id || null, valeur_critere || null]
  );
  return findById(result.insertId);
}

// AJOUT : modification d'une autorité (fonction, critère d'accès, actif).
async function update(id, { fonction, type_critere, domaine_id, valeur_critere, actif }) {
  await db.query(
    `UPDATE autorite SET fonction = ?, type_critere = ?, domaine_id = ?, valeur_critere = ?, actif = ? WHERE id = ?`,
    [fonction, type_critere, domaine_id || null, valeur_critere || null, actif, id]
  );
  return findById(id);
}

async function calculerStatistiques({ typeCritere, domaineId, valeurCritere }) {
  let condition;
  let params;

  if (typeCritere === 'DOMAINE') {
    condition = 'dem.domaine_id = ?';
    params = [domaineId];
  } else if (typeCritere === 'SEXE') {
    condition = 'u.sexe = ?';
    params = [valeurCritere];
  } else if (typeCritere === 'AGE_MAX') {
    condition = 'b.age_estime IS NOT NULL AND b.age_estime <= ?';
    params = [Number(valeurCritere)];
  } else {
    throw new Error(`type_critere inconnu : ${typeCritere}`);
  }

  const [rows] = await db.query(
    `SELECT
       COUNT(DISTINCT a.beneficiaire_id) AS nombre_beneficiaires,
       COUNT(DISTINCT f.id) AS nombre_financements,
       COALESCE(SUM(a.montant_attribue), 0) AS montant_total
     FROM attribution_financement a
     INNER JOIN financement f ON f.id = a.financement_id
     INNER JOIN beneficiaire b ON b.id = a.beneficiaire_id
     INNER JOIN utilisateur u ON u.id = b.utilisateur_id
     INNER JOIN demande_financement dem ON dem.id = f.demande_financement_id
     WHERE ${condition}`,
    params
  );
  return rows[0];
}

module.exports = { findAll, findById, findByUtilisateurId, create, update, calculerStatistiques };
