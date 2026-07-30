const financementService = require('../service/financement.service');

async function consulterTous(req, res) {
  try {
    const financements = await financementService.consulterTous();
    res.status(200).json({ financements });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function consulterParId(req, res) {
  try {
    const financement = await financementService.consulterParId(req.params.id);
    res.status(200).json({ financement });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

module.exports = { consulterTous, consulterParId };
