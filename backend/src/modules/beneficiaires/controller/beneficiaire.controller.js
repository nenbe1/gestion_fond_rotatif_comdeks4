const beneficiaireService = require('../service/beneficiaire.service');

async function creer(req, res) {
  try {
    const beneficiaire = await beneficiaireService.creer(req.body);
    res.status(201).json({ beneficiaire });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function consulterTous(req, res) {
  try {
    const beneficiaires = await beneficiaireService.consulterTous();
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
