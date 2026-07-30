const bcrypt = require('bcrypt');
const utilisateurRepository = require('../../authentification/repository/utilisateur.repository');
const beneficiaireRepository = require('../repository/beneficiaire.repository');
const attributionRepository = require('../../attributions/repository/attribution.repository');
const Beneficiaire = require('../model/beneficiaire.model');

const SALT_ROUNDS = 10;

function genererCodeUtilisateur() {
  return `BEN-${Date.now()}`;
}

/**
 * Un Beneficiaire hérite de Utilisateur : la création se fait donc en deux
 * temps (créer la ligne utilisateur, puis la ligne beneficiaire liée),
 * mais reste une seule opération du point de vue de l'appelant.
 */
async function creer({ nom, prenom, sexe, telephone, email, mot_de_passe, photo, age_estime, activite, latitude, longitude }) {
  const existant = await utilisateurRepository.findByTelephone(telephone);
  if (existant) {
    const erreur = new Error('Un utilisateur avec ce numéro de téléphone existe déjà.');
    erreur.statusCode = 409;
    throw erreur;
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

  const row = await beneficiaireRepository.create({
    utilisateur_id: utilisateur.id,
    age_estime,
    activite,
    latitude,
    longitude,
  });

  return Beneficiaire.fromRow(row);
}

async function consulterTous() {
  const rows = await beneficiaireRepository.findAll();
  return rows.map(Beneficiaire.fromRow);
}

async function consulterParId(id) {
  const row = await beneficiaireRepository.findById(id);
  if (!row) {
    const erreur = new Error('Bénéficiaire introuvable.');
    erreur.statusCode = 404;
    throw erreur;
  }
  return Beneficiaire.fromRow(row);
}

async function modifier(id, { age_estime, activite, latitude, longitude }) {
  await consulterParId(id); // vérifie l'existence, lève 404 sinon
  const row = await beneficiaireRepository.update(id, { age_estime, activite, latitude, longitude });
  return Beneficiaire.fromRow(row);
}

/**
 * Recalcule statutMMF à partir des AttributionFinancement/RemboursementBeneficiaire
 * réellement liés — logique simplifiée en attendant les modules financements/
 * remboursements (pas encore développés). À enrichir avec DemandeFinancement
 * ("EnAttente") une fois ce module écrit.
 */
async function recalculerStatutMMF(id) {
  await consulterParId(id);
  const situation = await beneficiaireRepository.calculerSituationFinanciere(id);

  let statut;
  if (situation.nb_attributions === 0) {
    statut = 'Nouveau';
  } else if (Number(situation.total_rembourse) >= Number(situation.total_attribue)) {
    statut = 'Solde';
  } else {
    statut = 'RemboursementEnCours';
  }

  await beneficiaireRepository.mettreAJourStatutMMF(id, statut);
  return statut;
}

/**
 * Consultation par le bénéficiaire connecté de son propre compte
 * (Mobile) : ses infos, ses financements reçus, et sa situation
 * financière globale (attribué / remboursé / reste dû avec la
 * majoration de 10% figée par financement).
 * @throws {Error} 403 si l'utilisateur connecté n'est pas un bénéficiaire
 */
async function consulterMonCompte(utilisateurId) {
  const row = await beneficiaireRepository.findByUtilisateurId(utilisateurId);
  if (!row) {
    const erreur = new Error("L'utilisateur connecté n'est pas enregistré comme bénéficiaire.");
    erreur.statusCode = 403;
    throw erreur;
  }
  const beneficiaire = Beneficiaire.fromRow(row);

  const [situation, financements] = await Promise.all([
    beneficiaireRepository.calculerSituationFinanciere(beneficiaire.id),
    attributionRepository.findByBeneficiaireId(beneficiaire.id),
  ]);

  return {
    beneficiaire,
    situation: {
      nombreFinancements: situation.nb_attributions,
      totalAttribue: Number(situation.total_attribue),
      totalRembourse: Number(situation.total_rembourse),
    },
    financements: financements.map((f) => ({
      id: f.id,
      codeFinancement: f.code_financement,
      montantAttribue: Number(f.montant_attribue),
      montantFinancementTotal: Number(f.montant_financement),
      dateAttribution: f.date_attribution,
    })),
  };
}

module.exports = { creer, consulterTous, consulterParId, modifier, recalculerStatutMMF, consulterMonCompte };
