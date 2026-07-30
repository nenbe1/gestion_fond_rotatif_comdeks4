const fondRotatifService = require('../service/fond_rotatif.service');

/**
 * Controller FondRotatif — traduit les requêtes HTTP en appels au service.
 */

/** GET /api/fond-rotatif */
async function consulterTous(req, res) {
  try {
    const fonds = await fondRotatifService.consulterTous();
    res.status(200).json({ fonds });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** GET /api/fond-rotatif/:id */
async function consulterParId(req, res) {
  try {
    const fond = await fondRotatifService.consulterParId(req.params.id);
    res.status(200).json({ fond });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** POST /api/fond-rotatif */
async function creer(req, res) {
  try {
    const fond = await fondRotatifService.creer(req.body);
    res.status(201).json({ fond });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** PUT /api/fond-rotatif/:id/alimenter — crédite manuellement le fonds. */
async function alimenter(req, res) {
  try {
    const fond = await fondRotatifService.alimenter(req.params.id, req.body.montant);
    res.status(200).json({ fond });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

module.exports = { consulterTous, consulterParId, creer, alimenter };
