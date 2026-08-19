const conseillerIAService = require('../service/conseiller_ia.service');

/** POST /api/conseiller-ia/demander — le bénéficiaire connecté pose une question. */
async function demander(req, res) {
  try {
    const echange = await conseillerIAService.poserQuestion(req.utilisateurId, req.body.question);
    res.status(201).json({ echange });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** GET /api/conseiller-ia/historique — l'historique des échanges du bénéficiaire connecté. */
async function consulterHistorique(req, res) {
  try {
    const historique = await conseillerIAService.consulterHistorique(req.utilisateurId);
    res.status(200).json({ historique });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** POST /api/conseiller-ia/analyse — génère l'analyse financière complète (4 sections) du bénéficiaire connecté. */
async function analyser(req, res) {
  try {
    const echange = await conseillerIAService.genererAnalyse(req.utilisateurId);
    res.status(201).json({ echange });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/**
 * Variantes Web (Responsable) : le bénéficiaire consulté vient de l'URL
 * (:id), pas de l'utilisateur connecté — voir conseiller_ia.routes.js
 * pour la restriction de rôle.
 */

/** POST /api/conseiller-ia/beneficiaires/:id/demander */
async function demanderPourBeneficiaire(req, res) {
  try {
    const echange = await conseillerIAService.poserQuestionPourBeneficiaire(req.params.id, req.body.question);
    res.status(201).json({ echange });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** POST /api/conseiller-ia/beneficiaires/:id/analyse */
async function analyserPourBeneficiaire(req, res) {
  try {
    const echange = await conseillerIAService.genererAnalysePourBeneficiaire(req.params.id);
    res.status(201).json({ echange });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** GET /api/conseiller-ia/beneficiaires/:id/historique */
async function consulterHistoriquePourBeneficiaire(req, res) {
  try {
    const historique = await conseillerIAService.consulterHistoriquePourBeneficiaire(req.params.id);
    res.status(200).json({ historique });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

module.exports = {
  demander,
  consulterHistorique,
  analyser,
  demanderPourBeneficiaire,
  analyserPourBeneficiaire,
  consulterHistoriquePourBeneficiaire,
};
