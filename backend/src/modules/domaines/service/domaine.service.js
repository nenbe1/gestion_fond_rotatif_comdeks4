const domaineRepository = require('../repository/domaine.repository');
const Domaine = require('../model/domaine.model');

/**
 * Construit une erreur HTTP avec un code de statut attaché, pour que le
 * controller puisse répondre avec le bon code (404, 400...) sans avoir
 * à connaître les détails de la logique métier.
 * @param {string} message
 * @param {number} statusCode
 * @returns {Error}
 */
function erreur(message, statusCode) {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
}

/**
 * Liste tous les domaines disponibles.
 * @returns {Promise<Domaine[]>}
 */
async function consulterTous() {
  const rows = await domaineRepository.findAll();
  return rows.map(Domaine.fromRow);
}

/**
 * Consulte un domaine précis.
 * @param {number} id
 * @throws {Error} 404 si le domaine n'existe pas
 * @returns {Promise<Domaine>}
 */
async function consulterParId(id) {
  const row = await domaineRepository.findById(id);
  if (!row) throw erreur('Domaine introuvable.', 404);
  return Domaine.fromRow(row);
}

/**
 * Crée un nouveau domaine (réservé en pratique à l'administrateur, via le
 * module Administration — non restreint ici au niveau du service).
 * @param {{nom: string, description?: string}} data
 * @returns {Promise<Domaine>}
 */
async function creer({ nom, description }) {
  const row = await domaineRepository.create({ nom, description });
  return Domaine.fromRow(row);
}

module.exports = { consulterTous, consulterParId, creer };
