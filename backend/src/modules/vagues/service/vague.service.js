const vagueRepository = require('../repository/vague.repository');
const Vague = require('../model/vague.model');

/** Construit une erreur HTTP avec un code de statut attaché. */
function erreur(message, statusCode) {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
}

/** Liste toutes les vagues. @returns {Promise<Vague[]>} */
async function consulterTous() {
  const rows = await vagueRepository.findAll();
  return rows.map(Vague.fromRow);
}

/**
 * Consulte une vague précise.
 * @throws {Error} 404 si introuvable
 */
async function consulterParId(id) {
  const row = await vagueRepository.findById(id);
  if (!row) throw erreur('Vague introuvable.', 404);
  return Vague.fromRow(row);
}

/** Crée une nouvelle vague (statut initial "Planifiee"). */
async function creer(data) {
  const row = await vagueRepository.create(data);
  return Vague.fromRow(row);
}

/**
 * Démarre une vague (Planifiee -> EnCours). Autorise les comités à
 * soumettre des DemandeFinancement rattachées à cette vague.
 * @throws {Error} 404 si la vague n'existe pas
 */
async function demarrer(id) {
  await consulterParId(id);
  const row = await vagueRepository.majStatut(id, 'EnCours');
  return Vague.fromRow(row);
}

/**
 * Clôture une vague (-> Cloturee). Marque la fin de la période de
 * soumission pour cette campagne.
 * @throws {Error} 404 si la vague n'existe pas
 */
async function cloturer(id) {
  await consulterParId(id);
  const row = await vagueRepository.majStatut(id, 'Cloturee');
  return Vague.fromRow(row);
}

module.exports = { consulterTous, consulterParId, creer, demarrer, cloturer };
