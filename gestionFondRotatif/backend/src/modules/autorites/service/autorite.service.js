const bcrypt = require('bcrypt');
const db = require('../../../config/db');
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
 * Un compte Autorite ne doit jamais être créé (ni modifié) en libre-
 * service : c'est la Responsable qui décide du critère (donc de ce que
 * le délégué pourra voir). Vérifié ici, pas seulement caché côté frontend.
 * @throws {Error} 403 si l'appelant n'est pas la Responsable
 */
async function verifierAppelantEstResponsable(utilisateurId) {
  const [rows] = await db.query(
    'SELECT id FROM responsable_fond_rotatif WHERE utilisateur_id = ? LIMIT 1',
    [utilisateurId]
  );
  if (!rows[0]) {
    throw erreur('Seule la Responsable du Fond Rotatif peut gérer les comptes délégués.', 403);
  }
}

async function creer(utilisateurConnecteId, { nom, prenom, sexe, telephone, email, mot_de_passe, photo, fonction, type_critere, domaine_id, valeur_critere }) {
  await verifierAppelantEstResponsable(utilisateurConnecteId);

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

// AJOUT : modification d'une autorité — réservée à la Responsable, comme
// la création. Met à jour à la fois les infos utilisateur (nom, prénom,
// téléphone...) et les infos propres à l'autorité (fonction, critère
// d'accès, actif).
async function modifier(utilisateurConnecteId, id, { nom, prenom, sexe, telephone, email, fonction, type_critere, domaine_id, valeur_critere, actif }) {
  await verifierAppelantEstResponsable(utilisateurConnecteId);

  const autoriteActuelle = await consulterParId(id);

  if (telephone && telephone !== autoriteActuelle.telephone) {
    const existant = await utilisateurRepository.findByTelephone(telephone);
    if (existant && existant.id !== autoriteActuelle.utilisateurId) {
      throw erreur('Un utilisateur avec ce numéro de téléphone existe déjà.', 409);
    }
  }

  await utilisateurRepository.update(autoriteActuelle.utilisateurId, {
    nom: nom ?? autoriteActuelle.nom,
    prenom: prenom ?? autoriteActuelle.prenom,
    sexe: sexe ?? autoriteActuelle.sexe,
    telephone: telephone ?? autoriteActuelle.telephone,
    email: email ?? autoriteActuelle.email,
  });

  const row = await autoriteRepository.update(id, {
    fonction: fonction ?? autoriteActuelle.fonction,
    type_critere: type_critere ?? autoriteActuelle.typeCritere,
    domaine_id: domaine_id !== undefined ? domaine_id : autoriteActuelle.domaineId,
    valeur_critere: valeur_critere !== undefined ? valeur_critere : autoriteActuelle.valeurCritere,
    actif: actif !== undefined ? actif : autoriteActuelle.actif,
  });

  return Autorite.fromRow(row);
}

async function resoudreAutoriteParUtilisateur(utilisateurId) {
  const row = await autoriteRepository.findByUtilisateurId(utilisateurId);
  if (!row) throw erreur("L'utilisateur connecté n'est pas enregistré comme délégué (Autorité).", 403);
  return Autorite.fromRow(row);
}

// CORRECTION : renvoie maintenant aussi "repartition" — le détail par
// canton et par activité (voir calculerRepartition), en plus des 3
// totaux globaux déjà présents. Avant, le délégué ne voyait qu'un
// agrégat unique, sans pouvoir dire QUEL canton ou QUELLE activité
// concentre les bénéficiaires/montants.
async function consulterMesStatistiques(utilisateurId) {
  const autorite = await resoudreAutoriteParUtilisateur(utilisateurId);

  const [stats, repartitionBrute] = await Promise.all([
    autoriteRepository.calculerStatistiques({
      typeCritere: autorite.typeCritere,
      domaineId: autorite.domaineId,
      valeurCritere: autorite.valeurCritere,
    }),
    autoriteRepository.calculerRepartition({
      typeCritere: autorite.typeCritere,
      domaineId: autorite.domaineId,
      valeurCritere: autorite.valeurCritere,
    }),
  ]);

  return {
    fonction: autorite.fonction,
    critere: libelleCritere(autorite),
    nombreBeneficiaires: stats.nombre_beneficiaires,
    nombreFinancements: stats.nombre_financements,
    montantTotal: Number(stats.montant_total),
    repartition: repartitionBrute.map((r) => ({
      cantonNom: r.canton_nom,
      activite: r.activite,
      nombreBeneficiaires: r.nombre_beneficiaires,
      montantTotal: Number(r.montant_total),
    })),
  };
}

function libelleCritere(autorite) {
  if (autorite.typeCritere === 'DOMAINE') return `Domaine : ${autorite.domaineNom}`;
  if (autorite.typeCritere === 'SEXE') return `Sexe : ${autorite.valeurCritere}`;
  return `Âge <= ${autorite.valeurCritere} ans`;
}

module.exports = { creer, consulterTous, consulterParId, modifier, resoudreAutoriteParUtilisateur, consulterMesStatistiques };
