const programmeRepository = require('../repository/programme.repository');
const Programme = require('../model/programme.model');

/** Construit une erreur HTTP avec un code de statut attaché. */
function erreur(message, statusCode) {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
}

/** Liste tous les programmes. @returns {Promise<Programme[]>} */
async function consulterTous() {
  const rows = await programmeRepository.findAll();
  return rows.map(Programme.fromRow);
}

/**
 * Consulte un programme précis.
 * @throws {Error} 404 si introuvable
 */
async function consulterParId(id) {
  const row = await programmeRepository.findById(id);
  if (!row) throw erreur('Programme introuvable.', 404);
  return Programme.fromRow(row);
}

/** Crée un nouveau programme. */
async function creer({ nom, description }) {
  const row = await programmeRepository.create({ nom, description });
  return Programme.fromRow(row);
}

module.exports = { consulterTous, consulterParId, creer };
