const bcrypt = require('bcrypt');
const utilisateurRepository = require('../../authentification/repository/utilisateur.repository');
const beneficiaireRepository = require('../repository/beneficiaire.repository');
const attributionRepository = require('../../attributions/repository/attribution.repository');
const Beneficiaire = require('../model/beneficiaire.model');

const SALT_ROUNDS = 10;

function erreur(message, statusCode) {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
}

function genererCodeUtilisateur() {
  return `BEN-${Date.now()}`;
}

/**
 * Un Beneficiaire hérite de Utilisateur : la création se fait donc en deux
 * temps (créer la ligne utilisateur, puis la ligne beneficiaire liée),
 * mais reste une seule opération du point de vue de l'appelant.
 */
async function creer({ nom, prenom, sexe, telephone, email, mot_de_passe, photo, canton_id, age_estime, activite, latitude, longitude }) {
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

  const row = await beneficiaireRepository.create({
    utilisateur_id: utilisateur.id,
    canton_id,
    age_estime,
    activite,
    latitude,
    longitude,
  });

  return Beneficiaire.fromRow(row);
}

async function consulterTous(cantonId) {
  const rows = await beneficiaireRepository.findAll({ cantonId });
  return rows.map(Beneficiaire.fromRow);
}

async function consulterParId(id) {
  const row = await beneficiaireRepository.findById(id);
  if (!row) {
    throw erreur('Bénéficiaire introuvable.', 404);
  }
  return Beneficiaire.fromRow(row);
}

async function modifier(id, { age_estime, activite, latitude, longitude }) {
  await consulterParId(id); // vérifie l'existence, lève 404 sinon
  const row = await beneficiaireRepository.update(id, { age_estime, activite, latitude, longitude });
  return Beneficiaire.fromRow(row);
}

/**
 * AJOUT : suppression définitive d'un bénéficiaire (créé par erreur ou
 * doublon, par exemple). Refusée si l'historique financier existe déjà
 * (demande le référençant, ou répartition/attribution déjà faite) — la
 * base de données elle-même protège cette règle via ses clés étrangères
 * (errno 1451 / code ER_ROW_IS_REFERENCED_2), on se contente ici de
 * traduire cette erreur SQL en message clair pour la personne qui utilise
 * l'app.
 */
async function supprimer(id) {
  const beneficiaire = await consulterParId(id); // 404 si introuvable
  try {
    await beneficiaireRepository.supprimer(id, beneficiaire.utilisateurId);
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
      throw erreur(
        "Impossible de supprimer : ce bénéficiaire est déjà lié à une demande de financement ou a déjà reçu une répartition. La suppression casserait l'historique.",
        409
      );
    }
    throw err;
  }
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
 * CORRECTION : chaque financement affiche maintenant son reste à payer
 * exact (montant attribué + majoration figée - ce qui est déjà
 * CONFIRMÉ par le Trésorier), au lieu d'un simple total global qui ne
 * tenait pas compte de la majoration ni de la distinction
 * "enregistré" / "confirmé" introduite par la double validation des
 * remboursements individuels.
 *
 * Consultation par le bénéficiaire connecté de son propre compte
 * (Mobile) : ses infos, chacun de ses financements avec son propre
 * reste à payer, et une situation globale agrégée.
 * @throws {Error} 403 si l'utilisateur connecté n'est pas un bénéficiaire
 */
async function consulterMonCompte(utilisateurId) {
  const row = await beneficiaireRepository.findByUtilisateurId(utilisateurId);
  if (!row) {
    throw erreur("L'utilisateur connecté n'est pas enregistré comme bénéficiaire.", 403);
  }
  const beneficiaire = Beneficiaire.fromRow(row);

  const financementsRows = await attributionRepository.findByBeneficiaireId(beneficiaire.id);

  const financements = await Promise.all(financementsRows.map(async (f) => {
    const montantRembourse = await attributionRepository.sommeRembourseePourAttribution(f.id);
    const montantAttribue = Number(f.montant_attribue);
    const tauxMajoration = Number(f.taux_majoration_applique);
    const montantDu = montantAttribue * (1 + tauxMajoration / 100);
    return {
      id: f.id,
      codeFinancement: f.code_financement,
      montantAttribue,
      montantFinancementTotal: Number(f.montant_financement),
      dateAttribution: f.date_attribution,
      tauxMajorationApplique: tauxMajoration,
      montantDu,
      montantRembourse,
      resteAPayer: Math.max(montantDu - montantRembourse, 0),
      soldee: montantRembourse >= montantDu,
    };
  }));

  const totalAttribue = financements.reduce((s, f) => s + f.montantAttribue, 0);
  const totalDu = financements.reduce((s, f) => s + f.montantDu, 0);
  const totalRembourse = financements.reduce((s, f) => s + f.montantRembourse, 0);

  return {
    beneficiaire,
    situation: {
      nombreFinancements: financements.length,
      totalAttribue,
      totalDu,
      totalRembourse,
      resteAPayer: Math.max(totalDu - totalRembourse, 0),
    },
    financements,
  };
}

module.exports = { creer, consulterTous, consulterParId, modifier, supprimer, recalculerStatutMMF, consulterMonCompte };
