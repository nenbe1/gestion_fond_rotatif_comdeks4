const db = require('../../../config/db');
const rapportRepository = require('../repository/rapport.repository');
const RapportGenere = require('../model/rapport.model');

function erreur(message, statusCode) {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
}

async function resoudreResponsableId(utilisateurId) {
  const [rows] = await db.query(
    'SELECT id FROM responsable_fond_rotatif WHERE utilisateur_id = ? LIMIT 1',
    [utilisateurId]
  );
  if (!rows[0]) {
    throw erreur("L'utilisateur connecté n'est pas la Responsable du Fond Rotatif.", 403);
  }
  return rows[0].id;
}

async function genererRapport(periodeDebut, periodeFin, generePar) {
  if (new Date(periodeFin) <= new Date(periodeDebut)) {
    throw erreur('periode_fin doit être postérieure à periode_debut.', 400);
  }

  const [nombreBeneficiaires, montantFinance, montantRembourse, nombreRetards] = await Promise.all([
    rapportRepository.compterBeneficiairesPeriode(periodeDebut, periodeFin),
    rapportRepository.sommeFinanceePeriode(periodeDebut, periodeFin),
    rapportRepository.sommeRembourseePeriode(periodeDebut, periodeFin),
    rapportRepository.compterRetardsPeriode(periodeDebut, periodeFin),
  ]);

  const tauxRemboursement = montantFinance > 0
    ? Math.round((montantRembourse / montantFinance) * 10000) / 100
    : 0;

  const row = await rapportRepository.create({
    periode_debut: periodeDebut,
    periode_fin: periodeFin,
    nombre_beneficiaires: nombreBeneficiaires,
    montant_total_finance: montantFinance,
    montant_total_rembourse: montantRembourse,
    taux_remboursement: tauxRemboursement,
    nombre_retards: nombreRetards,
    genere_par: generePar,
  });

  return RapportGenere.fromRow(row);
}

async function consulterParId(id) {
  const row = await rapportRepository.findById(id);
  if (!row) throw erreur('Rapport introuvable.', 404);
  return RapportGenere.fromRow(row);
}

async function consulterTous() {
  const rows = await rapportRepository.findAll();
  return rows.map(RapportGenere.fromRow);
}

// AJOUT : supprime un rapport déjà généré. Réservé à la Responsable,
// comme la génération (voir resoudreResponsableId dans le controller).
async function supprimer(id) {
  const row = await rapportRepository.findById(id);
  if (!row) throw erreur('Rapport introuvable.', 404);
  await rapportRepository.supprimer(id);
}

async function consulterRemboursementsParCanton() {
  const rows = await rapportRepository.remboursementsParCanton();
  return rows.map((r) => ({
    cantonId: r.canton_id,
    cantonNom: r.canton_nom,
    montantRembourse: Number(r.montant_rembourse),
    nombreRemboursements: r.nombre_remboursements,
  }));
}

/**
 * Détail nominatif des bénéficiaires financés sur la période d'un
 * rapport donné — utilise les dates figées du rapport (periode_debut/
 * periode_fin), pas des dates recalculées, pour que la liste
 * corresponde toujours exactement au chiffre "bénéficiaires touchés"
 * affiché sur ce rapport précis, même longtemps après sa génération.
 */
async function consulterDetailBeneficiaires(rapportId) {
  const rapport = await consulterParId(rapportId); // 404 si introuvable
  const rows = await rapportRepository.detailBeneficiairesPeriode(rapport.periodeDebut, rapport.periodeFin);
  return rows.map((r) => ({
    beneficiaireNom: r.beneficiaire_nom,
    beneficiairePrenom: r.beneficiaire_prenom,
    codeFinancement: r.code_financement,
    cantonNom: r.canton_nom || '—',
    montantAttribue: Number(r.montant_attribue),
    dateAttribution: r.date_attribution,
  }));
}

module.exports = {
  genererRapport, consulterParId, consulterTous, supprimer,
  resoudreResponsableId, consulterRemboursementsParCanton, consulterDetailBeneficiaires,
};
