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

module.exports = { demander, consulterHistorique };
