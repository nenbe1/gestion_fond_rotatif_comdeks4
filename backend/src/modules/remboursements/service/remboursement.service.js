const db = require('../../../config/db');
const remboursementRepository = require('../repository/remboursement.repository');
const attributionRepository = require('../../attributions/repository/attribution.repository');
const validationRepository = require('../../validations/repository/validation.repository');
const beneficiaireService = require('../../beneficiaires/service/beneficiaire.service');
const { RemboursementBeneficiaire, RemboursementCollectif } = require('../model/remboursement.model');

function erreur(message, statusCode) {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
}

// ---------- Niveau individuel ----------
// Rappel de conception : le bénéficiaire a déjà remis l'argent au comité
// avant l'enregistrement — c'est un fait accompli, pas de circuit de
// validation ici (contrairement au niveau collectif).

async function creerIndividuel({ attribution_financement_id, montant, date_versement, observation }) {
  const attribution = await attributionRepository.findById(attribution_financement_id);
  if (!attribution) throw erreur('Attribution introuvable.', 404);

  const dejaRembourse = await attributionRepository.sommeRembourseePourAttribution(attribution_financement_id);
  const resteAPayer = Number(attribution.montant_attribue) - dejaRembourse;
  if (Number(montant) > resteAPayer) {
    throw erreur(`Montant trop élevé : il reste ${resteAPayer} à rembourser sur cette attribution.`, 409);
  }

  const row = await remboursementRepository.createIndividuel({
    attribution_financement_id, montant, date_versement, observation,
  });

  // Recalcul automatique du statut MMF du bénéficiaire concerné (conçu
  // ensemble : le statut se met à jour à chaque événement pertinent).
  await beneficiaireService.recalculerStatutMMF(attribution.beneficiaire_id);

  return RemboursementBeneficiaire.fromRow(row);
}

async function consulterIndividuelParAttribution(attributionId) {
  const rows = await remboursementRepository.findIndividuelByAttributionId(attributionId);
  return rows.map(RemboursementBeneficiaire.fromRow);
}

// ---------- Niveau collectif ----------
// Protégé par le même circuit de validation à 3 niveaux que les demandes
// de financement (Trésorier -> Commissaire -> Président du comité).

async function getFinancement(financementId) {
  const [rows] = await db.query('SELECT id, fond_rotatif_id FROM financement WHERE id = ? LIMIT 1', [financementId]);
  return rows[0] || null;
}

async function creerCollectif({ financement_id, numero_semaine, date_prevue, montant_prevu }) {
  const financement = await getFinancement(financement_id);
  if (!financement) throw erreur('Financement introuvable.', 404);

  const row = await remboursementRepository.createCollectif({
    financement_id, numero_semaine, date_prevue, montant_prevu,
  });
  await validationRepository.creerCircuitPourRemboursementCollectif(row.id);
  return RemboursementCollectif.fromRow(row);
}

async function consulterCollectifParFinancement(financementId) {
  const rows = await remboursementRepository.findCollectifByFinancementId(financementId);
  return rows.map(RemboursementCollectif.fromRow);
}

async function consulterCollectifParId(id) {
  const row = await remboursementRepository.findCollectifById(id);
  if (!row) throw erreur('Remboursement collectif introuvable.', 404);
  return RemboursementCollectif.fromRow(row);
}

/**
 * Appelé par validations.service à l'approbation de la dernière étape
 * (Président, ordre 2) d'un circuit portant sur un RemboursementCollectif.
 * Contrairement au Financement, il n'y a pas de droit de veto de la
 * Responsable ici (règle non précisée par le président pour ce cas) :
 * l'approbation du comité aux 3 niveaux confirme directement le paiement.
 */
async function confirmerApresValidation(remboursementCollectifId) {
  const row = await remboursementRepository.findCollectifById(remboursementCollectifId);
  if (!row) throw erreur('Remboursement collectif introuvable.', 404);

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await remboursementRepository.confirmerPaiementCollectif(
      connection, remboursementCollectifId, row.montant_prevu, row.fond_rotatif_id
    );
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
  return consulterCollectifParId(remboursementCollectifId);
}

async function rejeterApresValidation(remboursementCollectifId) {
  await remboursementRepository.majStatutCollectif(remboursementCollectifId, 'Rejete');
}

module.exports = {
  creerIndividuel, consulterIndividuelParAttribution,
  creerCollectif, consulterCollectifParFinancement, consulterCollectifParId,
  confirmerApresValidation, rejeterApresValidation,
};
