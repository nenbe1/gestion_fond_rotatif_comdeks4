const db = require('../../../config/db');
const remboursementRepository = require('../repository/remboursement.repository');
const attributionRepository = require('../../attributions/repository/attribution.repository');
const financementRepository = require('../../financements/repository/financement.repository');
const validationRepository = require('../../validations/repository/validation.repository');
const beneficiaireService = require('../../beneficiaires/service/beneficiaire.service');
const { RemboursementBeneficiaire, RemboursementCollectif } = require('../model/remboursement.model');

function erreur(message, statusCode) {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
}

// ---------- Niveau individuel ----------
// CORRECTION (double validation) : le bénéficiaire remet l'argent
// physiquement au Trésorier, qui l'enregistre — mais ça ne compte pas
// encore pour lui à ce stade (statut 'EnAttente'). C'est seulement
// quand le Trésorier confirme (après avoir vérifié la somme) que le
// remboursement passe à 'Confirme' et impacte réellement la situation
// du bénéficiaire. Avant, un remboursement comptait dès son
// enregistrement, sans étape de vérification.

async function creerIndividuel({ attribution_financement_id, montant, date_versement, observation }, cantonIdAppelant) {
  const attribution = await attributionRepository.findById(attribution_financement_id);
  if (!attribution) throw erreur('Attribution introuvable.', 404);

  if (cantonIdAppelant) {
    const cantonFinancement = await financementRepository.trouverCantonId(attribution.financement_id);
    if (cantonFinancement !== null && cantonFinancement !== cantonIdAppelant) {
      throw erreur('Cette attribution appartient à un autre canton.', 403);
    }
  }

  // Ne compte que ce qui est déjà Confirme (voir attribution.repository) :
  // un remboursement encore EnAttente n'a pas encore réduit ce qu'il
  // reste à payer, donc le plafond se vérifie sur les seuls montants
  // déjà confirmés + celui qu'on est en train d'enregistrer.
  const dejaConfirme = await attributionRepository.sommeRembourseePourAttribution(attribution_financement_id);
  const resteAPayer = Number(attribution.montant_attribue) - dejaConfirme;
  if (Number(montant) > resteAPayer) {
    throw erreur(`Montant trop élevé : il reste ${resteAPayer} à rembourser sur cette attribution.`, 409);
  }

  const row = await remboursementRepository.createIndividuel({
    attribution_financement_id, montant, date_versement, observation,
  });

  return RemboursementBeneficiaire.fromRow(row);
}

/**
 * Confirme un remboursement individuel préalablement enregistré — c'est
 * seulement à cette étape qu'il compte réellement pour le bénéficiaire
 * (recalcul de son statut MMF déclenché ici, pas à la création).
 * @throws {Error} 404 si introuvable, 409 si déjà traité
 */
async function confirmerIndividuel(id, cantonIdAppelant) {
  const row = await remboursementRepository.findIndividuelById(id);
  if (!row) throw erreur('Remboursement introuvable.', 404);
  if (row.statut !== 'EnAttente') throw erreur('Ce remboursement a déjà été traité.', 409);

  const attribution = await attributionRepository.findById(row.attribution_financement_id);
  if (cantonIdAppelant) {
    const cantonFinancement = await financementRepository.trouverCantonId(attribution.financement_id);
    if (cantonFinancement !== null && cantonFinancement !== cantonIdAppelant) {
      throw erreur('Ce remboursement appartient à un autre canton.', 403);
    }
  }

  const updated = await remboursementRepository.majStatutIndividuel(id, 'Confirme');
  await beneficiaireService.recalculerStatutMMF(attribution.beneficiaire_id);
  return RemboursementBeneficiaire.fromRow(updated);
}

/**
 * AJOUT : permet au Trésorier de corriger une erreur de saisie avant
 * confirmation (ex: montant faux tapé par erreur) — annule
 * l'enregistrement sans jamais avoir compté pour le bénéficiaire, vu
 * qu'un remboursement EnAttente n'affecte pas encore sa situation.
 * @throws {Error} 404 si introuvable, 409 si déjà traité
 */
async function rejeterIndividuel(id, cantonIdAppelant) {
  const row = await remboursementRepository.findIndividuelById(id);
  if (!row) throw erreur('Remboursement introuvable.', 404);
  if (row.statut !== 'EnAttente') throw erreur('Ce remboursement a déjà été traité.', 409);

  const attribution = await attributionRepository.findById(row.attribution_financement_id);
  if (cantonIdAppelant) {
    const cantonFinancement = await financementRepository.trouverCantonId(attribution.financement_id);
    if (cantonFinancement !== null && cantonFinancement !== cantonIdAppelant) {
      throw erreur('Ce remboursement appartient à un autre canton.', 403);
    }
  }

  const updated = await remboursementRepository.majStatutIndividuel(id, 'Rejete');
  return RemboursementBeneficiaire.fromRow(updated);
}

async function consulterIndividuelParAttribution(attributionId) {
  const rows = await remboursementRepository.findIndividuelByAttributionId(attributionId);
  return rows.map(RemboursementBeneficiaire.fromRow);
}

// ---------- Niveau collectif (inchangé) ----------
// Protégé par le même circuit de validation à 3 niveaux que les demandes
// de financement (Trésorier -> Commissaire -> Président du comité).

async function getFinancement(financementId) {
  const [rows] = await db.query('SELECT id, fond_rotatif_id FROM financement WHERE id = ? LIMIT 1', [financementId]);
  return rows[0] || null;
}

async function creerCollectif({ financement_id, numero_semaine, date_prevue, montant_prevu }, cantonIdAppelant) {
  const financement = await getFinancement(financement_id);
  if (!financement) throw erreur('Financement introuvable.', 404);

  if (cantonIdAppelant) {
    const cantonFinancement = await financementRepository.trouverCantonId(financement_id);
    if (cantonFinancement !== null && cantonFinancement !== cantonIdAppelant) {
      throw erreur('Ce financement appartient à un autre canton.', 403);
    }
  }

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
  creerIndividuel, confirmerIndividuel, rejeterIndividuel, consulterIndividuelParAttribution,
  creerCollectif, consulterCollectifParFinancement, consulterCollectifParId,
  confirmerApresValidation, rejeterApresValidation,
};
