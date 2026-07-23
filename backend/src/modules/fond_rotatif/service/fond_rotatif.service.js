const fondRotatifRepository = require('../repository/fond_rotatif.repository');
const FondRotatif = require('../model/fond_rotatif.model');

/** Construit une erreur HTTP avec un code de statut attaché. */
function erreur(message, statusCode) {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
}

/** Liste tous les fonds rotatifs. @returns {Promise<FondRotatif[]>} */
async function consulterTous() {
  const rows = await fondRotatifRepository.findAll();
  return rows.map(FondRotatif.fromRow);
}

/**
 * Consulte un fonds rotatif précis.
 * @throws {Error} 404 si introuvable
 */
async function consulterParId(id) {
  const row = await fondRotatifRepository.findById(id);
  if (!row) throw erreur('Fonds rotatif introuvable.', 404);
  return FondRotatif.fromRow(row);
}

/** Crée un nouveau fonds rotatif. */
async function creer({ code_fond, libelle_fond, montant_fond }) {
  const row = await fondRotatifRepository.create({ code_fond, libelle_fond, montant_fond });
  return FondRotatif.fromRow(row);
}

/**
 * Alimente manuellement un fonds (ex: apport initial avant le début des
 * décaissements). Le crédit automatique via remboursement est géré
 * séparément dans modules/remboursements.
 * @throws {Error} 400 si le montant n'est pas positif, 404 si le fonds n'existe pas
 */
async function alimenter(id, montant) {
  if (!montant || Number(montant) <= 0) throw erreur('Le montant doit être positif.', 400);
  await consulterParId(id);
  const row = await fondRotatifRepository.alimenter(id, montant);
  return FondRotatif.fromRow(row);
}

module.exports = { consulterTous, consulterParId, creer, alimenter };
