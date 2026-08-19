const rapportService = require('../service/rapport.service');
const { genererRapportPdf } = require('../utils/rapport_pdf');

/**
 * Controller RapportGenere — traduit les requêtes HTTP en appels au
 * service. La génération et la suppression sont réservées à la
 * Responsable du Fond Rotatif (résolution de son identité via le token,
 * voir rapportService.resoudreResponsableId).
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

/** DELETE /api/rapports/:id — réservé à la Responsable, comme la génération. */
async function supprimer(req, res) {
  try {
    await rapportService.resoudreResponsableId(req.utilisateurId);
    await rapportService.supprimer(req.params.id);
    res.status(204).send();
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** GET /api/rapports/remboursements-par-canton */
async function consulterRemboursementsParCanton(req, res) {
  try {
    const remboursementsParCanton = await rapportService.consulterRemboursementsParCanton();
    res.status(200).json({ remboursementsParCanton });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** GET /api/rapports/:id/pdf — télécharge le rapport au format PDF. */
async function telechargerPdf(req, res) {
  try {
    const rapport = await rapportService.consulterParId(req.params.id);
    genererRapportPdf(res, rapport);
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** GET /api/rapports/:id/detail — détail nominatif des bénéficiaires financés sur la période du rapport. */
async function consulterDetail(req, res) {
  try {
    const detail = await rapportService.consulterDetailBeneficiaires(req.params.id);
    res.status(200).json({ detail });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

module.exports = {
  generer, consulterTous, consulterParId, supprimer, consulterRemboursementsParCanton, telechargerPdf, consulterDetail,
};
