const attributionService = require('../service/attribution.service');
const membreComiteRepository = require('../../membres_comite/repository/membre_comite.repository');

async function creer(req, res) {
  try {
    const membre = await membreComiteRepository.findByUtilisateurId(req.utilisateurId);
    const attribution = await attributionService.creer(req.body, membre?.canton_id);
    res.status(201).json({ attribution });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function consulterParFinancement(req, res) {
  try {
    const attributions = await attributionService.consulterParFinancement(req.params.financementId);
    res.status(200).json({ attributions });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function consulterParId(req, res) {
  try {
    const attribution = await attributionService.consulterParId(req.params.id);
    res.status(200).json({ attribution });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function resteAPayer(req, res) {
  try {
    const resultat = await attributionService.calculerResteAPayer(req.params.id);
    res.status(200).json(resultat);
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

module.exports = { creer, consulterParFinancement, consulterParId, resteAPayer };
