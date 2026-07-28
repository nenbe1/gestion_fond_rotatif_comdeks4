const bcrypt = require('bcrypt');
const utilisateurRepository = require('../../authentification/repository/utilisateur.repository');
const autoriteRepository = require('../repository/autorite.repository');
const Autorite = require('../model/autorite.model');

const SALT_ROUNDS = 10;

function genererCodeUtilisateur() {
  return `AUT-${Date.now()}`;
}

function erreur(message, statusCode) {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
}

/**
 * Une Autorite hérite de Utilisateur, comme Beneficiaire/MembreComite :
 * création de la ligne utilisateur, puis de la ligne autorite liée.
 * Un seul des deux (domaine_id / valeur_critere) est attendu, selon
 * type_critere — validé en amont par le validator.
 */
async function creer({ nom, prenom, sexe, telephone, email, mot_de_passe, photo, fonction, type_critere, domaine_id, valeur_critere }) {
  const existant = await utilisateurRepository.findByTelephone(telephone);
  if (existant) {
    throw erreur('Un utilisateur avec ce numéro de téléphone existe déjà.', 409);
  }

  const motDePasseHash = await bcrypt.hash(mot_de_passe, SALT_ROUNDS);

  const utilisateur = await utilisateurRepository.create({
    code_utilisateur: genererCodeUtilisateur(),
    nom,
    prenom,
    sexe,
    telephone,
    email,
    mot_de_passe: motDePasseHash,
    photo,
  });

  const row = await autoriteRepository.create({
    utilisateur_id: utilisateur.id,
    fonction,
    type_critere,
    domaine_id,
    valeur_critere,
  });

  return Autorite.fromRow(row);
}

async function consulterTous() {
  const rows = await autoriteRepository.findAll();
  return rows.map(Autorite.fromRow);
}

async function consulterParId(id) {
  const row = await autoriteRepository.findById(id);
  if (!row) throw erreur('Autorité introuvable.', 404);
  return Autorite.fromRow(row);
}

/**
 * Retrouve la ligne autorite liée à l'utilisateur actuellement connecté.
 * @throws {Error} 403 si l'utilisateur connecté n'est pas une Autorite
 */
async function resoudreAutoriteParUtilisateur(utilisateurId) {
  const row = await autoriteRepository.findByUtilisateurId(utilisateurId);
  if (!row) throw erreur("L'utilisateur connecté n'est pas enregistré comme délégué (Autorité).", 403);
  return Autorite.fromRow(row);
}

/**
 * Statistiques globales pour le délégué connecté — jamais de détail
 * nominatif, uniquement des totaux, filtrés selon son critère unique
 * (domaine, sexe ou âge maximum), sur l'ensemble des cantons.
 */
async function consulterMesStatistiques(utilisateurId) {
  const autorite = await resoudreAutoriteParUtilisateur(utilisateurId);
  const stats = await autoriteRepository.calculerStatistiques({
    typeCritere: autorite.typeCritere,
    domaineId: autorite.domaineId,
    valeurCritere: autorite.valeurCritere,
  });

  return {
    fonction: autorite.fonction,
    critere: libelleCritere(autorite),
    nombreBeneficiaires: stats.nombre_beneficiaires,
    nombreFinancements: stats.nombre_financements,
    montantTotal: Number(stats.montant_total),
  };
}

/** Libellé humain du critère, pour affichage ("Domaine : Agriculture", "Sexe : F", "Âge <= 30 ans"). */
function libelleCritere(autorite) {
  if (autorite.typeCritere === 'DOMAINE') return `Domaine : ${autorite.domaineNom}`;
  if (autorite.typeCritere === 'SEXE') return `Sexe : ${autorite.valeurCritere}`;
  return `Âge <= ${autorite.valeurCritere} ans`;
}

module.exports = { creer, consulterTous, consulterParId, resoudreAutoriteParUtilisateur, consulterMesStatistiques };
