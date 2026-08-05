const db = require('../../../config/db');
const demandeRepository = require('../repository/demande_financement.repository');
const beneficiairePrevuRepository = require('../repository/demande_beneficiaire_prevu.repository');
const validationRepository = require('../../validations/repository/validation.repository');
const financementService = require('../../financements/service/financement.service');
const DemandeFinancement = require('../model/demande_financement.model');

function erreur(message, statusCode) {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
}

/**
 * Résout l'id membre_comite à partir de l'utilisateur connecté — jamais
 * fourni par le client, pour que "qui a fait la demande" soit fiable.
 * @throws {Error} 403 si l'utilisateur connecté n'est pas membre d'un comité
 */
async function resoudreMembreComiteId(utilisateurId) {
  const [rows] = await db.query(
    'SELECT id FROM membre_comite WHERE utilisateur_id = ? LIMIT 1',
    [utilisateurId]
  );
  if (!rows[0]) {
    throw erreur("L'utilisateur connecté n'est pas membre d'un comité.", 403);
  }
  return rows[0].id;
}

/**
 * Créer une demande crée automatiquement les 3 étapes de Validation en
 * attente (Trésorier -> Commissaire -> Président), comme conçu ensemble.
 * Enregistre aussi la liste des bénéficiaires visés (sans montant à ce
 * stade — juste "qui"), fournie par le comité pour que la Responsable
 * sache qui sera concerné avant de valider.
 */
async function creer(data, membreComiteId, beneficiairesPrevus = []) {
  const row = await demandeRepository.create({ ...data, membre_comite_id: membreComiteId });
  await validationRepository.creerCircuitPourDemande(row.id);
  if (beneficiairesPrevus.length > 0) {
    await beneficiairePrevuRepository.createMany(row.id, beneficiairesPrevus);
  }
  return DemandeFinancement.fromRow(row);
}

async function consulterBeneficiairesPrevus(demandeId) {
  const rows = await beneficiairePrevuRepository.findByDemandeId(demandeId);
  return rows.map((r) => ({
    id: r.id,
    beneficiaireId: r.beneficiaire_id,
    beneficiaireNom: r.beneficiaire_nom,
    beneficiairePrenom: r.beneficiaire_prenom,
    nomLibre: r.nom_libre,
  }));
}

async function consulterTous(cantonId, exclureEnCours) {
  const rows = await demandeRepository.findAll({ cantonId, exclureEnCours });
  return rows.map(DemandeFinancement.fromRow);
}

async function consulterParId(id) {
  const row = await demandeRepository.findById(id);
  if (!row) throw erreur('Demande de financement introuvable.', 404);
  return DemandeFinancement.fromRow(row);
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

/**
 * Décision finale de la Responsable du Fond Rotatif, une fois le comité
 * ayant validé en interne (statut EnAttenteResponsable). La Responsable
 * garde un droit de refus, même après validation complète du comité.
 */
async function decisionResponsable(demandeId, { decision, fond_rotatif_id, programme_id }, responsableId) {
  if (!['Approuve', 'Rejete'].includes(decision)) {
    throw erreur("La décision doit être 'Approuve' ou 'Rejete'.", 400);
  }

  const demande = await demandeRepository.findById(demandeId);
  if (!demande) throw erreur('Demande de financement introuvable.', 404);
  if (demande.statut_global !== 'EnAttenteResponsable') {
    throw erreur("Cette demande n'est pas (ou plus) en attente de décision de la Responsable.", 409);
  }

  if (decision === 'Rejete') {
    await demandeRepository.majStatutGlobal(demandeId, 'Rejetee');
    return { demande: await consulterParId(demandeId), financement: null };
  }

  const financement = await financementService.creerDepuisDemande(demandeId, {
    fond_rotatif_id, programme_id, responsable_id: responsableId,
  });
  return { demande: await consulterParId(demandeId), financement };
}

module.exports = { creer, consulterTous, consulterParId, resoudreResponsableId, resoudreMembreComiteId, consulterBeneficiairesPrevus, decisionResponsable };
