const parametreService = require('../service/parametre.service');

/**
 * Controller Parametre — traduit les requêtes HTTP en appels au service.
 */

/** GET /api/parametres */
async function consulterTous(req, res) {
  try {
    const parametres = await parametreService.consulterTous();
    res.status(200).json({ parametres });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** GET /api/parametres/cle/:cle */
async function consulterParCle(req, res) {
  try {
    const parametre = await parametreService.consulterParCle(req.params.cle);
    res.status(200).json({ parametre });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** POST /api/parametres */
async function creer(req, res) {
  try {
    const parametre = await parametreService.creer(req.body);
    res.status(201).json({ parametre });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** PUT /api/parametres/:id — modifie la valeur d'un paramètre existant. */
async function modifier(req, res) {
  try {
    const parametre = await parametreService.modifier(req.params.id, req.body.valeur);
    res.status(200).json({ parametre });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

module.exports = { consulterTous, consulterParCle, creer, modifier };
