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

/**
 * Nombre de bénéficiaires distincts ayant reçu une attribution de
 * financement sur la période (indicateur "couverture" du programme).
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

/** Montant total décaissé (Financement) sur la période. */
async function sommeFinanceePeriode(periodeDebut, periodeFin) {
  const [rows] = await db.query(
    `SELECT COALESCE(SUM(montant_financement), 0) AS total
     FROM financement
     WHERE date_decaissement BETWEEN ? AND ?`,
    [periodeDebut, periodeFin]
  );
  return Number(rows[0].total);
}

/**
 * Montant total reversé au fonds (RemboursementCollectif confirmé) sur
 * la période — reflète la santé du fonds, pas le détail individuel.
 */
async function sommeRembourseePeriode(periodeDebut, periodeFin) {
  const [rows] = await db.query(
    `SELECT COALESCE(SUM(montant_verse), 0) AS total
     FROM remboursement_collectif
     WHERE statut = 'Confirme' AND date_paiement BETWEEN ? AND ?`,
    [periodeDebut, periodeFin]
  );
  return Number(rows[0].total);
}

/** Nombre de remboursements collectifs en retard, échéance dans la période. */
async function compterRetardsPeriode(periodeDebut, periodeFin) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS total
     FROM remboursement_collectif
     WHERE statut = 'EnRetard' AND date_prevue BETWEEN ? AND ?`,
    [periodeDebut, periodeFin]
  );
  return rows[0].total;
}

/** Persiste l'instantané calculé — jamais modifié après création. */
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

module.exports = {
  compterBeneficiairesPeriode, sommeFinanceePeriode, sommeRembourseePeriode,
  compterRetardsPeriode, create, findById, findAll,
};
