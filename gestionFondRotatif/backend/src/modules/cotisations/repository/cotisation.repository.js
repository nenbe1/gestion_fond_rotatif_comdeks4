const db = require('../../../config/db');

const SELECT_BASE = `
  SELECT
    c.*,
    g.nom AS groupe_nom, g.canton_id,
    ub.nom AS beneficiaire_nom, ub.prenom AS beneficiaire_prenom,
    um.nom AS enregistre_par_nom, um.prenom AS enregistre_par_prenom
  FROM cotisation c
  INNER JOIN groupe_mmf g ON g.id = c.groupe_mmf_id
  INNER JOIN beneficiaire b ON b.id = c.beneficiaire_id
  INNER JOIN utilisateur ub ON ub.id = b.utilisateur_id
  INNER JOIN membre_comite mc ON mc.id = c.enregistre_par
  INNER JOIN utilisateur um ON um.id = mc.utilisateur_id
`;

/**
 * Filtres tous optionnels et combinables : cantonId (comité, scope
 * automatique), groupeId, beneficiaireId, dateDebut/dateFin — pour la
 * fonction "recherche" du module.
 */
async function rechercher({ cantonId, groupeId, beneficiaireId, dateDebut, dateFin } = {}) {
  const conditions = [];
  const params = [];

  if (cantonId) { conditions.push('g.canton_id = ?'); params.push(cantonId); }
  if (groupeId) { conditions.push('c.groupe_mmf_id = ?'); params.push(groupeId); }
  if (beneficiaireId) { conditions.push('c.beneficiaire_id = ?'); params.push(beneficiaireId); }
  if (dateDebut) { conditions.push('c.date_versement >= ?'); params.push(dateDebut); }
  if (dateFin) { conditions.push('c.date_versement <= ?'); params.push(dateFin); }

  const clauseWhere = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await db.query(`${SELECT_BASE} ${clauseWhere} ORDER BY c.date_versement DESC`, params);
  return rows;
}

async function findById(id) {
  const [rows] = await db.query(`${SELECT_BASE} WHERE c.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function compterAnnee(annee) {
  const [rows] = await db.query('SELECT COUNT(*) AS total FROM cotisation WHERE YEAR(date_versement) = ?', [annee]);
  return rows[0].total;
}

async function create({ code_cotisation, groupe_mmf_id, beneficiaire_id, montant, date_versement, observation, enregistre_par }) {
  const [result] = await db.query(
    `INSERT INTO cotisation (code_cotisation, groupe_mmf_id, beneficiaire_id, montant, date_versement, observation, enregistre_par)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [code_cotisation, groupe_mmf_id, beneficiaire_id, montant, date_versement, observation || null, enregistre_par]
  );
  return findById(result.insertId);
}

/** Total cotisé par un bénéficiaire dans un groupe donné — utile pour son historique. */
async function sommeParBeneficiaireEtGroupe(beneficiaireId, groupeId) {
  const [rows] = await db.query(
    'SELECT COALESCE(SUM(montant), 0) AS total FROM cotisation WHERE beneficiaire_id = ? AND groupe_mmf_id = ?',
    [beneficiaireId, groupeId]
  );
  return Number(rows[0].total);
}

module.exports = { rechercher, findById, compterAnnee, create, sommeParBeneficiaireEtGroupe };
