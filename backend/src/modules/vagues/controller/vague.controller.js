const vagueService = require('../service/vague.service');

/**
 * Controller Vague — traduit les requêtes HTTP en appels au service.
 * Aucune logique métier ici : uniquement le mapping HTTP <-> service.
 */

/** GET /api/vagues */
async function consulterTous(req, res) {
  try {
    const vagues = await vagueService.consulterTous();
    res.status(200).json({ vagues });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** GET /api/vagues/:id */
async function consulterParId(req, res) {
  try {
    const vague = await vagueService.consulterParId(req.params.id);
    res.status(200).json({ vague });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** POST /api/vagues */
async function creer(req, res) {
  try {
    const vague = await vagueService.creer(req.body);
    res.status(201).json({ vague });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** PUT /api/vagues/:id/demarrer — passe la vague en "EnCours". */
async function demarrer(req, res) {
  try {
    const vague = await vagueService.demarrer(req.params.id);
    res.status(200).json({ vague });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** PUT /api/vagues/:id/cloturer — passe la vague en "Cloturee". */
async function cloturer(req, res) {
  try {
    const vague = await vagueService.cloturer(req.params.id);
    res.status(200).json({ vague });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

module.exports = { consulterTous, consulterParId, creer, demarrer, cloturer };
