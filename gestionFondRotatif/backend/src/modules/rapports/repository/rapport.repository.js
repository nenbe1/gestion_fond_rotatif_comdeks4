const db = require('../../../config/db');

/**
 * Repository RapportGenere — persistance de l'instantané (RapportGenere)
 * et requêtes d'agrégation utilisées pour le calculer.
 *
 * Rappel de conception : pas de table "Statistique" recalculée en direct.
 * RapportGenere fige les indicateurs à un instant donné (utile pour les
 * rapports hebdomadaires) — une fois créé, un rapport n'est jamais
 * recalculé rétroactivement même si les données sous-jacentes changent.
 */

async function compterBeneficiairesPeriode(periodeDebut, periodeFin) {
  const [rows] = await db.query(
    `SELECT COUNT(DISTINCT beneficiaire_id) AS total
     FROM attribution_financement
     WHERE date_attribution BETWEEN ? AND ?`,
    [periodeDebut, periodeFin]
  );
  return rows[0].total;
}

async function sommeFinanceePeriode(periodeDebut, periodeFin) {
  const [rows] = await db.query(
    `SELECT COALESCE(SUM(montant_financement), 0) AS total
     FROM financement
     WHERE date_decaissement BETWEEN ? AND ?`,
    [periodeDebut, periodeFin]
  );
  return Number(rows[0].total);
}

async function sommeRembourseePeriode(periodeDebut, periodeFin) {
  const [rows] = await db.query(
    `SELECT COALESCE(SUM(montant_verse), 0) AS total
     FROM remboursement_collectif
     WHERE statut = 'Confirme' AND date_paiement BETWEEN ? AND ?`,
    [periodeDebut, periodeFin]
  );
  return Number(rows[0].total);
}

async function compterRetardsPeriode(periodeDebut, periodeFin) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS total
     FROM remboursement_collectif
     WHERE statut = 'EnRetard' AND date_prevue BETWEEN ? AND ?`,
    [periodeDebut, periodeFin]
  );
  return rows[0].total;
}

async function create({
  periode_debut, periode_fin, nombre_beneficiaires, montant_total_finance,
  montant_total_rembourse, taux_remboursement, nombre_retards, genere_par,
}) {
  const [result] = await db.query(
    `INSERT INTO rapport_genere
      (date_generation, periode_debut, periode_fin, nombre_beneficiaires,
       montant_total_finance, montant_total_rembourse, taux_remboursement,
       nombre_retards, genere_par)
     VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      periode_debut, periode_fin, nombre_beneficiaires, montant_total_finance,
      montant_total_rembourse, taux_remboursement, nombre_retards, genere_par,
    ]
  );
  return findById(result.insertId);
}

async function findById(id) {
  const [rows] = await db.query('SELECT * FROM rapport_genere WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function findAll() {
  const [rows] = await db.query('SELECT * FROM rapport_genere ORDER BY date_generation DESC');
  return rows;
}

// AJOUT : suppression d'un rapport. Rien d'autre en base ne référence
// rapport_genere (voir commentaire de conception ci-dessus : c'est un
// instantané autonome), donc un DELETE direct est sans risque pour
// l'intégrité des autres données.
async function supprimer(id) {
  const [result] = await db.query('DELETE FROM rapport_genere WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

async function remboursementsParCanton() {
  const [rows] = await db.query(`
    SELECT
      c.id AS canton_id,
      c.nom AS canton_nom,
      COALESCE(SUM(rc.montant_verse), 0) AS montant_rembourse,
      COUNT(DISTINCT rc.id) AS nombre_remboursements
    FROM canton c
    LEFT JOIN membre_comite mc ON mc.canton_id = c.id
    LEFT JOIN demande_financement d ON d.membre_comite_id = mc.id
    LEFT JOIN financement f ON f.demande_financement_id = d.id
    LEFT JOIN remboursement_collectif rc ON rc.financement_id = f.id AND rc.statut = 'Confirme'
    GROUP BY c.id, c.nom
    ORDER BY c.nom ASC
  `);
  return rows;
}

/**
 * Détail nominatif des bénéficiaires financés sur une période — mêmes
 * critères exacts que compterBeneficiairesPeriode (date_attribution
 * BETWEEN), pour que la liste corresponde toujours au chiffre affiché
 * sur le rapport, même si on la consulte longtemps après sa génération.
 */
async function detailBeneficiairesPeriode(periodeDebut, periodeFin) {
  const [rows] = await db.query(
    `SELECT
       a.montant_attribue, a.date_attribution,
       u.nom AS beneficiaire_nom, u.prenom AS beneficiaire_prenom,
       f.code_financement, c.nom AS canton_nom
     FROM attribution_financement a
     INNER JOIN beneficiaire b ON b.id = a.beneficiaire_id
     INNER JOIN utilisateur u ON u.id = b.utilisateur_id
     INNER JOIN financement f ON f.id = a.financement_id
     LEFT JOIN canton c ON c.id = b.canton_id
     WHERE a.date_attribution BETWEEN ? AND ?
     ORDER BY a.date_attribution ASC`,
    [periodeDebut, periodeFin]
  );
  return rows;
}

module.exports = {
  compterBeneficiairesPeriode, sommeFinanceePeriode, sommeRembourseePeriode,
  compterRetardsPeriode, create, findById, findAll, supprimer, remboursementsParCanton,
  detailBeneficiairesPeriode,
};
