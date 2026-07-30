const autoriteService = require('../service/autorite.service');

async function creer(req, res) {
  try {
    const autorite = await autoriteService.creer(req.utilisateurId, req.body);
    res.status(201).json({ autorite });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function consulterTous(req, res) {
  try {
    const autorites = await autoriteService.consulterTous();
    res.status(200).json({ autorites });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function consulterParId(req, res) {
  try {
    const autorite = await autoriteService.consulterParId(req.params.id);
    res.status(200).json({ autorite });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** GET /api/autorites/moi/statistiques — statistiques du délégué connecté uniquement. */
async function consulterMesStatistiques(req, res) {
  try {
    const statistiques = await autoriteService.consulterMesStatistiques(req.utilisateurId);
    res.status(200).json({ statistiques });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

module.exports = { creer, consulterTous, consulterParId, consulterMesStatistiques };
