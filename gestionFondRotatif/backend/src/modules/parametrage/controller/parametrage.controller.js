const cantonService = require('../service/canton.service');
const fonctionService = require('../service/fonction.service');
const habilitationService = require('../service/habilitation.service');

/**
 * Controller Paramétrage — gestion centralisée des données de référence
 * (cantons, fonctions, habilitations). Volontairement séparé du module
 * "parametre" (singulier, /api/parametres) qui gère les réglages
 * clé/valeur (ex: taux de majoration) — pas touché ici, pour ne prendre
 * aucun risque de casser ce qui fonctionne déjà.
 */
function repondreErreur(res, erreur) {
  res.status(erreur.statusCode || 500).json({ message: erreur.message });
}

// ---------- Cantons ----------

async function consulterCantons(req, res) {
  try {
    const actifSeulement = req.query.actif === 'true';
    const cantons = await cantonService.consulterTous(actifSeulement);
    res.status(200).json({ cantons });
  } catch (erreur) { repondreErreur(res, erreur); }
}

async function creerCanton(req, res) {
  try {
    const canton = await cantonService.creer(req.body);
    res.status(201).json({ canton });
  } catch (erreur) { repondreErreur(res, erreur); }
}

async function modifierCanton(req, res) {
  try {
    const canton = await cantonService.modifier(req.params.id, req.body);
    res.status(200).json({ canton });
  } catch (erreur) { repondreErreur(res, erreur); }
}

async function desactiverCanton(req, res) {
  try {
    const canton = await cantonService.desactiver(req.params.id);
    res.status(200).json({ canton });
  } catch (erreur) { repondreErreur(res, erreur); }
}

async function activerCanton(req, res) {
  try {
    const canton = await cantonService.activer(req.params.id);
    res.status(200).json({ canton });
  } catch (erreur) { repondreErreur(res, erreur); }
}

// ---------- Fonctions (+ leurs habilitations) ----------

async function consulterFonctions(req, res) {
  try {
    const fonctions = await fonctionService.consulterTousAvecHabilitations();
    res.status(200).json({ fonctions });
  } catch (erreur) { repondreErreur(res, erreur); }
}

async function creerFonction(req, res) {
  try {
    const fonction = await fonctionService.creer(req.body);
    res.status(201).json({ fonction });
  } catch (erreur) { repondreErreur(res, erreur); }
}

async function modifierFonction(req, res) {
  try {
    const fonction = await fonctionService.modifierLibelle(req.params.id, req.body.libelle);
    res.status(200).json({ fonction });
  } catch (erreur) { repondreErreur(res, erreur); }
}

async function supprimerFonction(req, res) {
  try {
    await fonctionService.supprimer(req.params.id);
    res.status(204).send();
  } catch (erreur) { repondreErreur(res, erreur); }
}

async function definirHabilitationsFonction(req, res) {
  try {
    const fonction = await fonctionService.definirHabilitations(req.params.id, req.body.habilitation_ids);
    res.status(200).json({ fonction });
  } catch (erreur) { repondreErreur(res, erreur); }
}

// ---------- Habilitations ----------

async function consulterHabilitations(req, res) {
  try {
    const habilitations = await habilitationService.consulterTous();
    res.status(200).json({ habilitations });
  } catch (erreur) { repondreErreur(res, erreur); }
}

async function creerHabilitation(req, res) {
  try {
    const habilitation = await habilitationService.creer(req.body);
    res.status(201).json({ habilitation });
  } catch (erreur) { repondreErreur(res, erreur); }
}

async function supprimerHabilitation(req, res) {
  try {
    await habilitationService.supprimer(req.params.id);
    res.status(204).send();
  } catch (erreur) { repondreErreur(res, erreur); }
}

module.exports = {
  consulterCantons, creerCanton, modifierCanton, desactiverCanton, activerCanton,
  consulterFonctions, creerFonction, modifierFonction, supprimerFonction, definirHabilitationsFonction,
  consulterHabilitations, creerHabilitation, supprimerHabilitation,
};
