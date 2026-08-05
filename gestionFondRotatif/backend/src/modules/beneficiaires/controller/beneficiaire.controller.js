const beneficiaireService = require('../service/beneficiaire.service');
const membreComiteRepository = require('../../membres_comite/repository/membre_comite.repository');

/**
 * Un bénéficiaire est enregistré par un membre du comité (route déjà
 * réservée à ce rôle) — son canton est automatiquement celui du membre
 * qui l'enregistre, jamais choisi manuellement (garantit qu'un
 * bénéficiaire est toujours rattaché au bon comité local).
 */
async function creer(req, res) {
  try {
    const membre = await membreComiteRepository.findByUtilisateurId(req.utilisateurId);
    const beneficiaire = await beneficiaireService.creer({ ...req.body, canton_id: membre?.canton_id });
    res.status(201).json({ beneficiaire });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** Un membre du comité ne voit que les bénéficiaires de son propre canton ; la Responsable/Administration voit tout. */
async function consulterTous(req, res) {
  try {
    let cantonId;
    if (req.role === 'MEMBRE_COMITE') {
      const membre = await membreComiteRepository.findByUtilisateurId(req.utilisateurId);
      cantonId = membre?.canton_id;
    }
    const beneficiaires = await beneficiaireService.consulterTous(cantonId);
    res.status(200).json({ beneficiaires });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function consulterParId(req, res) {
  try {
    const beneficiaire = await beneficiaireService.consulterParId(req.params.id);
    res.status(200).json({ beneficiaire });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function modifier(req, res) {
  try {
    const beneficiaire = await beneficiaireService.modifier(req.params.id, req.body);
    res.status(200).json({ beneficiaire });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function recalculerStatut(req, res) {
  try {
    const statut = await beneficiaireService.recalculerStatutMMF(req.params.id);
    res.status(200).json({ statutMMF: statut });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** GET /api/beneficiaires/moi/compte — pour le Mobile : le bénéficiaire consulte son propre compte. */
async function consulterMonCompte(req, res) {
  try {
    const compte = await beneficiaireService.consulterMonCompte(req.utilisateurId);
    res.status(200).json({ compte });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

module.exports = { creer, consulterTous, consulterParId, modifier, recalculerStatut, consulterMonCompte };
