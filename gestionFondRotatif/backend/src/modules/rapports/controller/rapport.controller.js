const rapportService = require('../service/rapport.service');

/**
 * Controller RapportGenere — traduit les requêtes HTTP en appels au
 * service. La génération est réservée à la Responsable du Fond Rotatif
 * (résolution de son identité via le token, voir rapportService.resoudreResponsableId).
 */

/** POST /api/rapports — génère un nouvel instantané pour la période fournie. */
async function generer(req, res) {
  try {
    const responsableId = await rapportService.resoudreResponsableId(req.utilisateurId);
    const rapport = await rapportService.genererRapport(
      req.body.periode_debut,
      req.body.periode_fin,
      responsableId
    );
    res.status(201).json({ rapport });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** GET /api/rapports */
async function consulterTous(req, res) {
  try {
    const rapports = await rapportService.consulterTous();
    res.status(200).json({ rapports });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** GET /api/rapports/:id */
async function consulterParId(req, res) {
  try {
    const rapport = await rapportService.consulterParId(req.params.id);
    res.status(200).json({ rapport });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

module.exports = { generer, consulterTous, consulterParId };
