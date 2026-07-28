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

/**
 * Calcule les statistiques globales (jamais de détail nominatif) des
 * financements allés vers la catégorie de bénéficiaires correspondant
 * au critère du délégué. Toujours calculé sur l'ensemble des cantons
 * (le délégué voit tout ce qui le concerne, sans restriction géographique).
 *
 * DOMAINE  -> filtre sur demande_financement.domaine_id (le domaine du
 *             projet financé, ex. Agriculture).
 * SEXE / AGE_MAX -> filtre sur le bénéficiaire réellement attributaire
 *             (attribution_financement -> beneficiaire), puisque ce sont
 *             des attributs de la personne, pas du projet.
 */
async function calculerStatistiques({ typeCritere, domaineId, valeurCritere }) {
  let condition;
  let params;

  if (typeCritere === 'DOMAINE') {
    condition = 'dem.domaine_id = ?';
    params = [domaineId];
  } else if (typeCritere === 'SEXE') {
    condition = 'b.sexe = ?';
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
     INNER JOIN demande_financement dem ON dem.id = f.demande_financement_id
     WHERE ${condition}`,
    params
  );
  return rows[0];
}

module.exports = { findAll, findById, findByUtilisateurId, create, calculerStatistiques };
