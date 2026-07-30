const db = require('../../../config/db');
const rapportRepository = require('../repository/rapport.repository');
const RapportGenere = require('../model/rapport.model');

function erreur(message, statusCode) {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
}

/**
 * Retrouve l'id de la ligne responsable_fond_rotatif liée à l'utilisateur
 * actuellement connecté. Seule la Responsable génère des rapports —
 * cohérent avec son rôle de vue d'ensemble sur le fonds.
 * @throws {Error} 403 si l'utilisateur connecté n'est pas la Responsable
 */
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

/**
 * Génère un rapport pour une période donnée : calcule les indicateurs à
 * partir des tables réelles (Financement, RemboursementCollectif,
 * AttributionFinancement), puis les fige dans un RapportGenere immuable.
 *
 * Important : cette fonction n'est jamais rappelée pour "mettre à jour" un
 * rapport existant — si une correction est nécessaire, on génère un
 * nouveau rapport plutôt que de modifier un instantané déjà émis (utile
 * en cas de litige : on peut toujours retrouver ce qui a été présenté à
 * telle date).
 *
 * @param {string} periodeDebut - format YYYY-MM-DD
 * @param {string} periodeFin - format YYYY-MM-DD
 * @param {number} generePar - id du responsable_fond_rotatif qui génère le rapport
 * @throws {Error} 400 si periodeFin <= periodeDebut
 */
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

  // Taux de remboursement = part du montant financé déjà reversée au fonds
  // sur la période. 0 par défaut si rien n'a été financé (évite une
  // division par zéro plutôt qu'une erreur).
  const tauxRemboursement = montantFinance > 0
    ? Math.round((montantRembourse / montantFinance) * 10000) / 100 // 2 décimales
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

/** Consulte un rapport précis. @throws {Error} 404 si introuvable */
async function consulterParId(id) {
  const row = await rapportRepository.findById(id);
  if (!row) throw erreur('Rapport introuvable.', 404);
  return RapportGenere.fromRow(row);
}

/** Liste tous les rapports déjà générés, du plus récent au plus ancien. */
async function consulterTous() {
  const rows = await rapportRepository.findAll();
  return rows.map(RapportGenere.fromRow);
}

module.exports = { genererRapport, consulterParId, consulterTous, resoudreResponsableId };
