const groupeRepository = require('../repository/groupe_mmf.repository');
const beneficiaireRepository = require('../../beneficiaires/repository/beneficiaire.repository');
const { GroupeMMF, AdhesionGroupe } = require('../model/groupe_mmf.model');

function erreur(message, statusCode) {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
}

/**
 * Un groupe MMF est créé par le comité, sur le terrain (comme les
 * bénéficiaires) — toujours rattaché au canton du membre du comité qui
 * le crée, jamais choisi manuellement (même logique que pour
 * Beneficiaire.creer).
 */
async function creer({ nom }, cantonId) {
  if (!cantonId) throw erreur("Impossible de déterminer le canton de l'utilisateur connecté.", 400);
  const row = await groupeRepository.create({ nom, canton_id: cantonId });
  return GroupeMMF.fromRow(row);
}

async function consulterTous(cantonId) {
  const rows = await groupeRepository.findAll({ cantonId });
  return rows.map(GroupeMMF.fromRow);
}

async function consulterParId(id) {
  const row = await groupeRepository.findById(id);
  if (!row) throw erreur('Groupe MMF introuvable.', 404);
  return GroupeMMF.fromRow(row);
}

/** Vérifie que l'appelant (canton du comité) a bien le droit de gérer ce groupe. */
async function verifierAccesCanton(groupe, cantonIdAppelant) {
  if (cantonIdAppelant && groupe.cantonId !== cantonIdAppelant) {
    throw erreur('Ce groupe appartient à un autre canton.', 403);
  }
}

async function modifierNom(id, nom, cantonIdAppelant) {
  const groupe = await consulterParId(id);
  await verifierAccesCanton(groupe, cantonIdAppelant);
  const row = await groupeRepository.update(id, {
    nom, responsable_beneficiaire_id: groupe.responsableBeneficiaireId, actif: groupe.actif,
  });
  return GroupeMMF.fromRow(row);
}

async function basculerActif(id, actif, cantonIdAppelant) {
  const groupe = await consulterParId(id);
  await verifierAccesCanton(groupe, cantonIdAppelant);
  const row = await groupeRepository.update(id, {
    nom: groupe.nom, responsable_beneficiaire_id: groupe.responsableBeneficiaireId, actif,
  });
  return GroupeMMF.fromRow(row);
}

// ---------- Adhésions ----------

async function ajouterMembre(groupeId, beneficiaireId, cantonIdAppelant) {
  const groupe = await consulterParId(groupeId);
  await verifierAccesCanton(groupe, cantonIdAppelant);

  const beneficiaireRow = await beneficiaireRepository.findById(beneficiaireId);
  if (!beneficiaireRow) throw erreur('Bénéficiaire introuvable.', 404);
  if (beneficiaireRow.canton_id && beneficiaireRow.canton_id !== groupe.cantonId) {
    throw erreur('Ce bénéficiaire appartient à un autre canton que le groupe.', 409);
  }

  const row = await groupeRepository.ajouterMembre(groupeId, beneficiaireId);
  return AdhesionGroupe.fromRow(row);
}

async function retirerMembre(adhesionId, groupeId, cantonIdAppelant) {
  const groupe = await consulterParId(groupeId);
  await verifierAccesCanton(groupe, cantonIdAppelant);

  const adhesion = await groupeRepository.findAdhesionById(adhesionId);
  if (!adhesion || adhesion.groupe_mmf_id !== Number(groupeId)) {
    throw erreur('Adhésion introuvable pour ce groupe.', 404);
  }

  // Un responsable qui quitte le groupe : on retire aussi son statut de
  // responsable, un groupe ne peut pas être dirigé par un ex-membre.
  if (groupe.responsableBeneficiaireId === adhesion.beneficiaire_id) {
    await groupeRepository.update(groupeId, { nom: groupe.nom, responsable_beneficiaire_id: null, actif: groupe.actif });
  }

  const row = await groupeRepository.retirerMembre(adhesionId);
  return AdhesionGroupe.fromRow(row);
}

async function consulterMembres(groupeId) {
  await consulterParId(groupeId); // 404 si le groupe n'existe pas
  const rows = await groupeRepository.findMembresByGroupeId(groupeId, { actifSeulement: true });
  return rows.map(AdhesionGroupe.fromRow);
}

/** Les groupes du bénéficiaire connecté, avec sa date d'adhésion à chacun. */
async function mesGroupes(beneficiaireId) {
  const rows = await groupeRepository.findGroupesByBeneficiaireId(beneficiaireId);
  return rows.map((row) => ({ ...GroupeMMF.fromRow(row), dateAdhesion: row.date_adhesion }));
}

/**
 * Désigne le responsable du groupe — doit obligatoirement être un membre
 * ACTIF du groupe lui-même (élu parmi ses pairs, jamais quelqu'un
 * d'extérieur).
 * @throws {Error} 409 si le bénéficiaire choisi n'est pas membre actif du groupe
 */
async function definirResponsable(groupeId, beneficiaireId, cantonIdAppelant) {
  const groupe = await consulterParId(groupeId);
  await verifierAccesCanton(groupe, cantonIdAppelant);

  const adhesion = await groupeRepository.findAdhesion(groupeId, beneficiaireId);
  if (!adhesion || !adhesion.actif) {
    throw erreur('Le responsable doit être un membre actif de ce groupe.', 409);
  }

  const row = await groupeRepository.update(groupeId, {
    nom: groupe.nom, responsable_beneficiaire_id: beneficiaireId, actif: groupe.actif,
  });
  return GroupeMMF.fromRow(row);
}

module.exports = {
  creer, consulterTous, consulterParId, modifierNom, basculerActif,
  ajouterMembre, retirerMembre, consulterMembres, definirResponsable, mesGroupes,
};
