const programmeService = require('../service/programme.service');

/**
 * Controller Programme — traduit les requêtes HTTP en appels au service.
 */

/** GET /api/programmes */
async function consulterTous(req, res) {
  try {
    const programmes = await programmeService.consulterTous();
    res.status(200).json({ programmes });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** GET /api/programmes/:id */
async function consulterParId(req, res) {
  try {
    const programme = await programmeService.consulterParId(req.params.id);
    res.status(200).json({ programme });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** POST /api/programmes */
async function creer(req, res) {
  try {
    const programme = await programmeService.creer(req.body);
    res.status(201).json({ programme });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

module.exports = { consulterTous, consulterParId, creer };
