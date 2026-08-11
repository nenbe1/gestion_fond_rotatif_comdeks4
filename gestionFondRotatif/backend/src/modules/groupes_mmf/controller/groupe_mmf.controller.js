const groupeService = require('../service/groupe_mmf.service');
const membreComiteRepository = require('../../membres_comite/repository/membre_comite.repository');
const beneficiaireRepository = require('../../beneficiaires/repository/beneficiaire.repository');

async function resoudreCantonAppelant(req) {
  if (req.role !== 'MEMBRE_COMITE') return undefined; // Responsable/Autorité : pas de restriction de canton
  const membre = await membreComiteRepository.findByUtilisateurId(req.utilisateurId);
  return membre?.canton_id;
}

async function creer(req, res) {
  try {
    const cantonId = await resoudreCantonAppelant(req);
    const groupe = await groupeService.creer(req.body, cantonId);
    res.status(201).json({ groupe });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

// CORRECTION : consulterTous() n'imposait aucune restriction pour un
// bénéficiaire — il voyait tous les groupes de tout le pays au lieu de
// rien (ce n'est pas à lui de parcourir cette liste, voir mesGroupes()
// ci-dessous pour son propre cas d'usage).
async function consulterTous(req, res) {
  try {
    if (req.role === 'BENEFICIAIRE') {
      return res.status(403).json({ message: "Utilisez /groupes-mmf/mes-groupes pour consulter vos propres groupes." });
    }
    const cantonId = await resoudreCantonAppelant(req);
    const groupes = await groupeService.consulterTous(cantonId);
    res.status(200).json({ groupes });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** GET /api/groupes-mmf/mes-groupes — les groupes du bénéficiaire connecté. */
async function mesGroupes(req, res) {
  try {
    const beneficiaire = await beneficiaireRepository.findByUtilisateurId(req.utilisateurId);
    if (!beneficiaire) return res.status(403).json({ message: 'Compte bénéficiaire introuvable.' });
    const groupes = await groupeService.mesGroupes(beneficiaire.id);
    res.status(200).json({ groupes });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function consulterParId(req, res) {
  try {
    const groupe = await groupeService.consulterParId(req.params.id);
    res.status(200).json({ groupe });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function modifierNom(req, res) {
  try {
    const cantonId = await resoudreCantonAppelant(req);
    const groupe = await groupeService.modifierNom(req.params.id, req.body.nom, cantonId);
    res.status(200).json({ groupe });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function desactiver(req, res) {
  try {
    const cantonId = await resoudreCantonAppelant(req);
    const groupe = await groupeService.basculerActif(req.params.id, false, cantonId);
    res.status(200).json({ groupe });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function activer(req, res) {
  try {
    const cantonId = await resoudreCantonAppelant(req);
    const groupe = await groupeService.basculerActif(req.params.id, true, cantonId);
    res.status(200).json({ groupe });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function consulterMembres(req, res) {
  try {
    const membres = await groupeService.consulterMembres(req.params.id);
    res.status(200).json({ membres });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function ajouterMembre(req, res) {
  try {
    const cantonId = await resoudreCantonAppelant(req);
    const adhesion = await groupeService.ajouterMembre(req.params.id, req.body.beneficiaire_id, cantonId);
    res.status(201).json({ adhesion });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function retirerMembre(req, res) {
  try {
    const cantonId = await resoudreCantonAppelant(req);
    const adhesion = await groupeService.retirerMembre(req.params.adhesionId, req.params.id, cantonId);
    res.status(200).json({ adhesion });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function definirResponsable(req, res) {
  try {
    const cantonId = await resoudreCantonAppelant(req);
    const groupe = await groupeService.definirResponsable(req.params.id, req.body.beneficiaire_id, cantonId);
    res.status(200).json({ groupe });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

module.exports = {
  creer, consulterTous, consulterParId, modifierNom, desactiver, activer,
  consulterMembres, ajouterMembre, retirerMembre, definirResponsable, mesGroupes,
};
