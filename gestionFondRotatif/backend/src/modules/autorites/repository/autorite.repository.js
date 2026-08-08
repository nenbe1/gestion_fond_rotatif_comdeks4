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

/**
 * Construit la condition SQL correspondant au critère du délégué
 * (DOMAINE / SEXE / AGE_MAX) — factorisé, utilisé à la fois par
 * calculerStatistiques (totaux) et calculerRepartition (détail par
 * canton/activité).
 */
function construireConditionCritere({ typeCritere, domaineId, valeurCritere }) {
  if (typeCritere === 'DOMAINE') {
    return { condition: 'dem.domaine_id = ?', params: [domaineId] };
  }
  if (typeCritere === 'SEXE') {
    return { condition: 'u.sexe = ?', params: [valeurCritere] };
  }
  if (typeCritere === 'AGE_MAX') {
    return { condition: 'b.age_estime IS NOT NULL AND b.age_estime <= ?', params: [Number(valeurCritere)] };
  }
  throw new Error(`type_critere inconnu : ${typeCritere}`);
}

async function calculerStatistiques({ typeCritere, domaineId, valeurCritere }) {
  const { condition, params } = construireConditionCritere({ typeCritere, domaineId, valeurCritere });

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

// AJOUT : détail "tel nombre de bénéficiaires de tel canton ont reçu
// telle somme pour telle activité" — même critère d'accès du délégué
// que calculerStatistiques, mais regroupé par canton du bénéficiaire et
// par son activité, au lieu d'un seul total global.
// CORRECTION : l'activité est un champ texte libre (saisi par le
// comité) — deux bénéficiaires "Agricultrice" et "agricultrice " (casse
// ou espace différents) étaient donc comptés comme deux groupes séparés
// au lieu d'un seul. On regroupe maintenant sur une version normalisée
// (espaces superflus retirés, casse ignorée via LOWER), tout en
// affichant une orthographe représentative du groupe (MIN, arbitraire
// mais stable) plutôt que le texte brut exact de chaque ligne.
// CORRECTION 2 : même souci avec le singulier/pluriel ("agricultrice"
// vs "agricultrices") — toujours la même personne/activité, mais un 's'
// final suffisait à créer un deuxième groupe. On l'ignore aussi
// maintenant dans la clé de regroupement (uniquement pour grouper : le
// texte affiché reste tel quel, choisi arbitrairement via MIN).
async function calculerRepartition({ typeCritere, domaineId, valeurCritere }) {
  const { condition, params } = construireConditionCritere({ typeCritere, domaineId, valeurCritere });

  const [rows] = await db.query(
    `SELECT
       COALESCE(c.nom, 'Canton non renseigné') AS canton_nom,
       COALESCE(MIN(TRIM(b.activite)), 'Activité non renseignée') AS activite,
       COUNT(DISTINCT a.beneficiaire_id) AS nombre_beneficiaires,
       COALESCE(SUM(a.montant_attribue), 0) AS montant_total
     FROM attribution_financement a
     INNER JOIN financement f ON f.id = a.financement_id
     INNER JOIN beneficiaire b ON b.id = a.beneficiaire_id
     INNER JOIN utilisateur u ON u.id = b.utilisateur_id
     INNER JOIN demande_financement dem ON dem.id = f.demande_financement_id
     LEFT JOIN canton c ON c.id = b.canton_id
     WHERE ${condition}
     GROUP BY c.nom, TRIM(TRAILING 's' FROM LOWER(TRIM(b.activite)))
     ORDER BY c.nom ASC, activite ASC`,
    params
  );
  return rows;
}

module.exports = { findAll, findById, findByUtilisateurId, create, update, calculerStatistiques, calculerRepartition };
