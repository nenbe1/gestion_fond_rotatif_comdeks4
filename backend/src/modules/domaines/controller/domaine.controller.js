const domaineService = require('../service/domaine.service');

/**
 * Controller Domaine — traduit les requêtes HTTP en appels au service,
 * et le résultat (ou l'erreur) en réponse HTTP. Ne contient aucune
 * logique métier : celle-ci vit exclusivement dans le service.
 */

/** GET /api/domaines — liste tous les domaines. */
async function consulterTous(req, res) {
  try {
    const domaines = await domaineService.consulterTous();
    res.status(200).json({ domaines });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** GET /api/domaines/:id — consulte un domaine précis. */
async function consulterParId(req, res) {
  try {
    const domaine = await domaineService.consulterParId(req.params.id);
    res.status(200).json({ domaine });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** POST /api/domaines — crée un nouveau domaine. */
async function creer(req, res) {
  try {
    const domaine = await domaineService.creer(req.body);
    res.status(201).json({ domaine });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

module.exports = { consulterTous, consulterParId, creer };
