const penaliteService = require('../service/penalite_retard.service');

/** GET /api/penalites-retard/en-attente */
async function consulterEnAttente(req, res) {
  try {
    const penalites = await penaliteService.consulterEnAttente();
    res.status(200).json({ penalites });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** PUT /api/penalites-retard/:id/decision */
async function decider(req, res) {
  try {
    const penalite = await penaliteService.decider(req.params.id, req.body.decision, req.utilisateurId);
    res.status(200).json({ penalite });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

module.exports = { consulterEnAttente, decider };
