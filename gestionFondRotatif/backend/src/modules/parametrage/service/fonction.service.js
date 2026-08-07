const fonctionRepository = require('../repository/fonction.repository');
const Fonction = require('../model/fonction.model');

function erreur(message, statusCode) {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
}

/**
 * Ces 3 codes sont utilisés en dur dans la logique du circuit de
 * validation (validations/service/validation.service.js compare
 * directement etape.niveau à la fonction du membre connecté) — les
 * supprimer ou en changer le code casserait silencieusement le circuit
 * à 3 niveaux. Le libellé affiché, lui, reste librement modifiable.
 */
const CODES_PROTEGES = ['TRESORIER', 'COMMISSAIRE', 'PRESIDENT'];

async function consulterTousAvecHabilitations() {
  const fonctions = await fonctionRepository.findAll();
  return Promise.all(
    fonctions.map(async (f) => {
      const habilitations = await fonctionRepository.findHabilitationsDeFonction(f.id);
      return Fonction.fromRow(f, habilitations.map((h) => ({ id: h.id, code: h.code, libelle: h.libelle })));
    })
  );
}

async function consulterParId(id) {
  const row = await fonctionRepository.findById(id);
  if (!row) throw erreur('Fonction introuvable.', 404);
  const habilitations = await fonctionRepository.findHabilitationsDeFonction(id);
  return Fonction.fromRow(row, habilitations.map((h) => ({ id: h.id, code: h.code, libelle: h.libelle })));
}

async function creer({ code, libelle }) {
  const existant = await fonctionRepository.findByCode(code);
  if (existant) throw erreur('Une fonction avec ce code existe déjà.', 409);
  const row = await fonctionRepository.create({ code: code.toUpperCase(), libelle });
  return Fonction.fromRow(row, []);
}

/** Seul le libellé est modifiable — le code est une clé métier stable, jamais changée après création. */
async function modifierLibelle(id, libelle) {
  await consulterParId(id);
  const row = await fonctionRepository.updateLibelle(id, libelle);
  const habilitations = await fonctionRepository.findHabilitationsDeFonction(id);
  return Fonction.fromRow(row, habilitations);
}

/**
 * @throws {Error} 404 si introuvable, 409 si protégée ou encore utilisée
 *   par des membres du comité
 */
async function supprimer(id) {
  const fonction = await consulterParId(id);
  if (CODES_PROTEGES.includes(fonction.code)) {
    throw erreur(
      `La fonction ${fonction.code} est essentielle au circuit de validation et ne peut pas être supprimée.`,
      409
    );
  }
  const nbMembres = await fonctionRepository.compterMembresRattaches(id);
  if (nbMembres > 0) {
    throw erreur(
      `Impossible de supprimer cette fonction : ${nbMembres} membre(s) du comité y sont rattaché(s).`,
      409
    );
  }
  await fonctionRepository.supprimer(id);
}

async function definirHabilitations(fonctionId, habilitationIds) {
  await consulterParId(fonctionId);
  await fonctionRepository.definirHabilitations(fonctionId, habilitationIds);
  return consulterParId(fonctionId);
}

module.exports = {
  consulterTousAvecHabilitations, consulterParId, creer, modifierLibelle, supprimer, definirHabilitations,
  CODES_PROTEGES,
};
