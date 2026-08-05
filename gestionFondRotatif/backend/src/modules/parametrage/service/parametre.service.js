const parametreRepository = require('../repository/parametre.repository');
const Parametre = require('../model/parametre.model');

function erreur(message, statusCode) {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
}

/** Liste tous les paramètres. @returns {Promise<Parametre[]>} */
async function consulterTous() {
  const rows = await parametreRepository.findAll();
  return rows.map(Parametre.fromRow);
}

/**
 * Consulte un paramètre par sa clé (ex: "taux_majoration_remboursement").
 * Utilisé par les autres modules pour lire une valeur de configuration.
 * @throws {Error} 404 si la clé n'existe pas
 */
async function consulterParCle(cle) {
  const row = await parametreRepository.findByCle(cle);
  if (!row) throw erreur(`Paramètre "${cle}" introuvable.`, 404);
  return Parametre.fromRow(row);
}

/** Crée un nouveau paramètre. */
async function creer({ cle, valeur, description }) {
  const existant = await parametreRepository.findByCle(cle);
  if (existant) throw erreur(`Un paramètre avec la clé "${cle}" existe déjà.`, 409);
  const row = await parametreRepository.create({ cle, valeur, description });
  return Parametre.fromRow(row);
}

/**
 * Modifie la valeur d'un paramètre existant (ex: passer le taux de
 * majoration de 10% à 12%). Réservé à l'administrateur — non restreint
 * ici au niveau du service, à faire respecter par les permissions/rôles
 * une fois le module Administration développé.
 * @throws {Error} 404 si le paramètre n'existe pas
 */
async function modifier(id, valeur) {
  const row = await parametreRepository.findById(id);
  if (!row) throw erreur('Paramètre introuvable.', 404);
  const updated = await parametreRepository.updateValeur(id, valeur);
  return Parametre.fromRow(updated);
}

module.exports = { consulterTous, consulterParCle, creer, modifier };
