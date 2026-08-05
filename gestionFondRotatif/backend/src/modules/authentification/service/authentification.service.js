const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../../config/db');
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

/**
 * Détermine le rôle métier d'un utilisateur (au-delà de l'authentification
 * générique) en cherchant à quelle table métier il est rattaché.
 * Utilisé par le frontend Web pour restreindre l'accès à la Responsable
 * et l'Administration — les membres du comité et bénéficiaires utilisent
 * le client Mobile (voir échange avec le président sur la répartition
 * Web/Mobile).
 * @param {number} utilisateurId
 * @returns {Promise<'RESPONSABLE'|'MEMBRE_COMITE'|'BENEFICIAIRE'|'AUTORITE'|'INDETERMINE'>}
 */
async function resoudreRole(utilisateurId) {
  const [responsable] = await db.query(
    'SELECT id FROM responsable_fond_rotatif WHERE utilisateur_id = ? LIMIT 1', [utilisateurId]
  );
  if (responsable.length > 0) return 'RESPONSABLE';

  const [membre] = await db.query(
    'SELECT id FROM membre_comite WHERE utilisateur_id = ? LIMIT 1', [utilisateurId]
  );
  if (membre.length > 0) return 'MEMBRE_COMITE';

  const [beneficiaire] = await db.query(
    'SELECT id FROM beneficiaire WHERE utilisateur_id = ? LIMIT 1', [utilisateurId]
  );
  if (beneficiaire.length > 0) return 'BENEFICIAIRE';

  const [autorite] = await db.query(
    'SELECT id FROM autorite WHERE utilisateur_id = ? LIMIT 1', [utilisateurId]
  );
  if (autorite.length > 0) return 'AUTORITE';

  return 'INDETERMINE';
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

  const role = await resoudreRole(row.id);

  const token = jwt.sign(
    { id: row.id, telephone: row.telephone, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  const utilisateur = Utilisateur.fromRow(row);
  utilisateur.role = role;

  if (role === 'MEMBRE_COMITE') {
    const membreComiteRepository = require('../../membres_comite/repository/membre_comite.repository');
    const membre = await membreComiteRepository.findByUtilisateurId(row.id);
    if (!membre) {
      const erreur = new Error('Compte membre du comité introuvable ou incomplet — contactez la Responsable.');
      erreur.statusCode = 500;
      throw erreur;
    }
    utilisateur.fonctionCode = membre.fonction_code;
    utilisateur.fonctionLibelle = membre.fonction_libelle;
  }

  return { token, utilisateur };
}

module.exports = { inscrire, connecter };
