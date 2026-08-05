const bcrypt = require('bcrypt');
const utilisateurRepository = require('../../authentification/repository/utilisateur.repository');
const membreComiteRepository = require('../repository/membre_comite.repository');
const MembreComite = require('../model/membre_comite.model');

const SALT_ROUNDS = 10;

function erreur(message, statusCode) {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
}

function genererCodeUtilisateur() {
  return `MCO-${Date.now()}`;
}

/**
 * MembreComite hérite de Utilisateur (comme Beneficiaire) : la création
 * crée d'abord la ligne utilisateur, puis la ligne membre_comite liée.
 */
async function creer({ nom, prenom, sexe, telephone, email, mot_de_passe, photo, fonction_id, canton_id }) {
  const existant = await utilisateurRepository.findByTelephone(telephone);
  if (existant) {
    throw erreur('Un utilisateur avec ce numéro de téléphone existe déjà.', 409);
  }

  const motDePasseHash = await bcrypt.hash(mot_de_passe, SALT_ROUNDS);

  const utilisateur = await utilisateurRepository.create({
    code_utilisateur: genererCodeUtilisateur(),
    nom, prenom, sexe, telephone, email,
    mot_de_passe: motDePasseHash,
    photo,
  });

  const row = await membreComiteRepository.create({
    utilisateur_id: utilisateur.id,
    fonction_id,
    canton_id,
  });

  return MembreComite.fromRow(row);
}

async function consulterTous() {
  const rows = await membreComiteRepository.findAll();
  return rows.map(MembreComite.fromRow);
}

async function consulterParId(id) {
  const row = await membreComiteRepository.findById(id);
  if (!row) throw erreur('Membre du comité introuvable.', 404);
  return MembreComite.fromRow(row);
}

// CORRECTION : modifier() gère maintenant aussi nom / prenom / sexe /
// telephone / email (table utilisateur), en plus de fonction_id /
// canton_id / actif (table membre_comite) — avant, seuls ces deux
// derniers étaient modifiables, impossible de corriger une faute de
// saisie sur le nom ou changer un numéro de téléphone.
async function modifier(id, { nom, prenom, sexe, telephone, email, fonction_id, canton_id, actif }) {
  const membreActuel = await consulterParId(id);

  if (telephone && telephone !== membreActuel.telephone) {
    const existant = await utilisateurRepository.findByTelephone(telephone);
    if (existant && existant.id !== membreActuel.utilisateurId) {
      throw erreur('Un utilisateur avec ce numéro de téléphone existe déjà.', 409);
    }
  }

  await utilisateurRepository.update(membreActuel.utilisateurId, {
    nom: nom ?? membreActuel.nom,
    prenom: prenom ?? membreActuel.prenom,
    sexe: sexe ?? membreActuel.sexe,
    telephone: telephone ?? membreActuel.telephone,
    email: email ?? membreActuel.email,
  });

  const row = await membreComiteRepository.update(id, { fonction_id, canton_id, actif });
  return MembreComite.fromRow(row);
}

async function listerFonctions() {
  return membreComiteRepository.findAllFonctions();
}

async function listerCantons() {
  return membreComiteRepository.findAllCantons();
}

async function creerCanton({ nom, latitude, longitude }) {
  if (!nom || nom.trim().length < 2) {
    throw erreur('Le nom du canton est requis.', 400);
  }
  return membreComiteRepository.createCanton({ nom, latitude, longitude });
}

module.exports = { creer, consulterTous, consulterParId, modifier, listerFonctions, listerCantons, creerCanton };
