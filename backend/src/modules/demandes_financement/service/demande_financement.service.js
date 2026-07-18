const demandeRepository = require('../repository/demande_financement.repository');
const validationRepository = require('../../validations/repository/validation.repository');
const DemandeFinancement = require('../model/demande_financement.model');

function erreur(message, statusCode) {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
}

/**
 * Créer une demande crée automatiquement les 3 étapes de Validation en
 * attente (Trésorier -> Commissaire -> Président), comme conçu ensemble.
 */
async function creer(data) {
  const row = await demandeRepository.create(data);
  await validationRepository.creerCircuitPourDemande(row.id);
  return DemandeFinancement.fromRow(row);
}

async function consulterTous() {
  const rows = await demandeRepository.findAll();
  return rows.map(DemandeFinancement.fromRow);
}

async function consulterParId(id) {
  const row = await demandeRepository.findById(id);
  if (!row) throw erreur('Demande de financement introuvable.', 404);
  return DemandeFinancement.fromRow(row);
}

module.exports = { creer, consulterTous, consulterParId };
