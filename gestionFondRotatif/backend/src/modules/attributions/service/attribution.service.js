const db = require('../../../config/db');
const attributionRepository = require('../repository/attribution.repository');
const financementRepository = require('../../financements/repository/financement.repository');
const beneficiaireRepository = require('../../beneficiaires/repository/beneficiaire.repository');
const AttributionFinancement = require('../model/attribution.model');

function erreur(message, statusCode) {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
}

async function getFinancement(financementId) {
  const [rows] = await db.query(
    'SELECT id, montant_financement FROM financement WHERE id = ? LIMIT 1',
    [financementId]
  );
  return rows[0] || null;
}

/**
 * Attribue une part du financement à un bénéficiaire. Vérifie que la somme
 * des attributions ne dépasse jamais le montant total du financement, et
 * qu'un même bénéficiaire ne peut recevoir qu'une seule attribution par
 * financement (contrainte UNIQUE déjà posée en base).
 *
 * Cloisonnement par canton (défense en profondeur — la liste des
 * bénéficiaires proposée côté Mobile est déjà filtrée par canton, mais
 * on revérifie ici au cas où l'appel API serait fait directement) : le
 * financement ET le bénéficiaire doivent appartenir au même canton que
 * le comité qui répartit.
 */
async function creer({ financement_id, beneficiaire_id, montant_attribue }, cantonIdAppelant) {
  const financement = await getFinancement(financement_id);
  if (!financement) throw erreur('Financement introuvable.', 404);

  if (cantonIdAppelant) {
    const cantonFinancement = await financementRepository.trouverCantonId(financement_id);
    if (cantonFinancement !== null && cantonFinancement !== cantonIdAppelant) {
      throw erreur('Ce financement appartient à un autre canton.', 403);
    }
    const beneficiaire = await beneficiaireRepository.findById(beneficiaire_id);
    if (beneficiaire?.canton_id && beneficiaire.canton_id !== cantonIdAppelant) {
      throw erreur('Ce bénéficiaire appartient à un autre canton.', 403);
    }
  }

  const existant = await attributionRepository.findByFinancementEtBeneficiaire(financement_id, beneficiaire_id);
  if (existant) throw erreur('Ce bénéficiaire a déjà une attribution sur ce financement.', 409);

  const dejaAttribue = await attributionRepository.sommeAttribueePourFinancement(financement_id);
  const montantRestant = Number(financement.montant_financement) - dejaAttribue;
  if (Number(montant_attribue) > montantRestant) {
    throw erreur(
      `Montant trop élevé : il reste ${montantRestant} à répartir sur ce financement.`,
      409
    );
  }

  const row = await attributionRepository.create({ financement_id, beneficiaire_id, montant_attribue });
  return AttributionFinancement.fromRow(row);
}

async function consulterParFinancement(financementId) {
  const rows = await attributionRepository.findByFinancementId(financementId);
  return rows.map(AttributionFinancement.fromRow);
}

async function consulterParId(id) {
  const row = await attributionRepository.findById(id);
  if (!row) throw erreur('Attribution introuvable.', 404);
  return AttributionFinancement.fromRow(row);
}

// CORRECTION : calcule maintenant le "reste à payer" en tenant compte de
// la majoration figée par financement (avant : resteAPayer = montantAttribue
// - rembourse, sans jamais ajouter la majoration — ce qui sous-estimait
// systématiquement ce que le bénéficiaire devait réellement encore).
async function calculerResteAPayer(id) {
  const attribution = await consulterParId(id);
  const rembourse = await attributionRepository.sommeRembourseePourAttribution(id);
  const montantAttribue = Number(attribution.montantAttribue);
  const montantDu = montantAttribue * (1 + Number(attribution.tauxMajorationApplique) / 100);
  return {
    montantAttribue,
    tauxMajorationApplique: Number(attribution.tauxMajorationApplique),
    montantDu,
    montantRembourse: rembourse,
    resteAPayer: Math.max(montantDu - rembourse, 0),
    soldee: rembourse >= montantDu,
  };
}

module.exports = { creer, consulterParFinancement, consulterParId, calculerResteAPayer };
