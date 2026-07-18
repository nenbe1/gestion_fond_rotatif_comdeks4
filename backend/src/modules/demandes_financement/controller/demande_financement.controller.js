const demandeService = require('../service/demande_financement.service');

async function creer(req, res) {
  try {
    const demande = await demandeService.creer(req.body);
    res.status(201).json({ demande });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function consulterTous(req, res) {
  try {
    const demandes = await demandeService.consulterTous();
    res.status(200).json({ demandes });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function consulterParId(req, res) {
  try {
    const demande = await demandeService.consulterParId(req.params.id);
    res.status(200).json({ demande });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

module.exports = { creer, consulterTous, consulterParId };
