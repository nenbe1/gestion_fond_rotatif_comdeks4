const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const utilisateurRepository = require('../repository/utilisateur.repository');
const Utilisateur = require('../model/utilisateur.model');

const SALT_ROUNDS = 10;

/**
 * Génère un code utilisateur lisible.
 * Format simple pour l'instant : UTI-<timestamp>. À affiner si le
 * président confirme un format officiel (comme pour code_financement).
 */
function genererCodeUtilisateur() {
  return `UTI-${Date.now()}`;
}

async function inscrire({ nom, prenom, sexe, telephone, email, mot_de_passe, photo }) {
  const existant = await utilisateurRepository.findByTelephone(telephone);
  if (existant) {
    const erreur = new Error('Un utilisateur avec ce numéro de téléphone existe déjà.');
    erreur.statusCode = 409;
    throw erreur;
  }

  const motDePasseHash = await bcrypt.hash(mot_de_passe, SALT_ROUNDS);

  const row = await utilisateurRepository.create({
    code_utilisateur: genererCodeUtilisateur(),
    nom,
    prenom,
    sexe,
    telephone,
    email,
    mot_de_passe: motDePasseHash,
    photo,
  });

  return Utilisateur.fromRow(row);
}

async function connecter({ telephone, mot_de_passe }) {
  const row = await utilisateurRepository.findByTelephone(telephone);
  if (!row) {
    const erreur = new Error('Identifiants incorrects.');
    erreur.statusCode = 401;
    throw erreur;
  }

  const motDePasseValide = await bcrypt.compare(mot_de_passe, row.mot_de_passe);
  if (!motDePasseValide) {
    const erreur = new Error('Identifiants incorrects.');
    erreur.statusCode = 401;
    throw erreur;
  }

  if (!row.actif) {
    const erreur = new Error('Ce compte a été désactivé.');
    erreur.statusCode = 403;
    throw erreur;
  }

  const token = jwt.sign(
    { id: row.id, telephone: row.telephone },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { token, utilisateur: Utilisateur.fromRow(row) };
}

module.exports = { inscrire, connecter };
