const habilitationRepository = require('../repository/habilitation.repository');
const Habilitation = require('../model/habilitation.model');

function erreur(message, statusCode) {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
}

async function consulterTous() {
  const rows = await habilitationRepository.findAll();
  return rows.map(Habilitation.fromRow);
}

async function creer({ code, libelle }) {
  const existant = await habilitationRepository.findByCode(code);
  if (existant) throw erreur('Une habilitation avec ce code existe déjà.', 409);
  const row = await habilitationRepository.create({ code: code.toUpperCase(), libelle });
  return Habilitation.fromRow(row);
}

/**
 * Supprimer une habilitation la retire aussi de toutes les fonctions
 * qui l'avaient (fonction_habilitation) — c'est voulu : une habilitation
 * qui n'existe plus ne peut être accordée à personne.
 */
async function supprimer(id) {
  const row = await habilitationRepository.findById(id);
  if (!row) throw erreur('Habilitation introuvable.', 404);
  await habilitationRepository.supprimer(id);
}

module.exports = { consulterTous, creer, supprimer };
