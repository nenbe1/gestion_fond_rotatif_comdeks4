const cantonRepository = require('../repository/canton.repository');
const Canton = require('../model/canton.model');

function erreur(message, statusCode) {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
}

async function consulterTous(actifSeulement) {
  const rows = await cantonRepository.findAll({ actifSeulement });
  return rows.map(Canton.fromRow);
}

async function consulterParId(id) {
  const row = await cantonRepository.findById(id);
  if (!row) throw erreur('Canton introuvable.', 404);
  return Canton.fromRow(row);
}

async function creer({ nom, latitude, longitude }) {
  const existant = await cantonRepository.findByNom(nom);
  if (existant) throw erreur('Un canton avec ce nom existe déjà.', 409);
  const row = await cantonRepository.create({ nom, latitude, longitude });
  return Canton.fromRow(row);
}

async function modifier(id, { nom, latitude, longitude }) {
  await consulterParId(id);
  const row = await cantonRepository.update(id, { nom, latitude, longitude });
  return Canton.fromRow(row);
}

/**
 * Désactive un canton plutôt que de le supprimer : un canton est
 * référencé par des membres du comité, des bénéficiaires et des
 * demandes déjà créées — le supprimer casserait tout cet historique.
 * Désactivé, il n'apparaît simplement plus dans les listes de choix
 * pour de nouvelles créations, sans toucher à l'existant.
 */
async function desactiver(id) {
  await consulterParId(id);
  const row = await cantonRepository.majActif(id, false);
  return Canton.fromRow(row);
}

async function activer(id) {
  await consulterParId(id);
  const row = await cantonRepository.majActif(id, true);
  return Canton.fromRow(row);
}

module.exports = { consulterTous, consulterParId, creer, modifier, desactiver, activer };
