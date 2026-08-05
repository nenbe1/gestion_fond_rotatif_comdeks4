const db = require('../../../config/db');

const SELECT_BASE = `
  SELECT
    d.*,
    mc.utilisateur_id AS initiateur_utilisateur_id,
    v.nom AS vague_nom,
    dom.nom AS domaine_nom,
    c.id AS canton_id, c.nom AS canton_nom
  FROM demande_financement d
  INNER JOIN membre_comite mc ON mc.id = d.membre_comite_id
  INNER JOIN vague v ON v.id = d.vague_id
  INNER JOIN domaine dom ON dom.id = d.domaine_id
  LEFT JOIN canton c ON c.id = mc.canton_id
`;

// CORRECTION : ajout du parametre exclureEnCours. Quand il est a true
// (cas de la Responsable), les demandes encore "EnCours" (circuit du
// comite pas termine) ne sont jamais renvoyees par la base - ce n'est
// plus seulement filtre cote frontend, donc impossible a contourner.
async function findAll({ cantonId, exclureEnCours } = {}) {
  const conditions = [];
  const parametres = [];

  if (cantonId) {
    conditions.push('mc.canton_id = ?');
    parametres.push(cantonId);
  }
  if (exclureEnCours) {
    conditions.push("d.statut_global != 'EnCours'");
  }

  const clauseWhere = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await db.query(`${SELECT_BASE} ${clauseWhere} ORDER BY d.date_creation DESC`, parametres);
  return rows;
}

async function findById(id) {
  const [rows] = await db.query(`${SELECT_BASE} WHERE d.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

function genererCodeDemande() {
  return `DEM-${Date.now()}`;
}

async function create({
  membre_comite_id, vague_id, domaine_id, objet_demande, resultat_attendu,
  periode_previsionnelle, site_travail, nb_femmes_benef, nb_hommes_benef,
  montant_demande, co_financement_en_nature, co_financement_especes,
}) {
  const [result] = await db.query(
    `INSERT INTO demande_financement
      (code_demande, membre_comite_id, vague_id, domaine_id, objet_demande,
       resultat_attendu, periode_previsionnelle, site_travail,
       nb_femmes_benef, nb_hommes_benef, montant_demande,
       co_financement_en_nature, co_financement_especes, statut_global)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'EnCours')`,
    [
      genererCodeDemande(), membre_comite_id, vague_id, domaine_id, objet_demande,
      resultat_attendu || null, periode_previsionnelle || null, site_travail || null,
      nb_femmes_benef || 0, nb_hommes_benef || 0, montant_demande,
      co_financement_en_nature || null, co_financement_especes || null,
    ]
  );
  return findById(result.insertId);
}

async function majStatutGlobal(id, statut) {
  await db.query('UPDATE demande_financement SET statut_global = ? WHERE id = ?', [statut, id]);
}

module.exports = { findAll, findById, create, majStatutGlobal };
