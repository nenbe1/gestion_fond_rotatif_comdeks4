const express = require('express');
const router = express.Router();

const conseillerIAController = require('../controller/conseiller_ia.controller');
const { validerQuestion } = require('../validator/conseiller_ia.validator');
const { verifierToken } = require('../../../middlewares/auth.middleware');

router.use(verifierToken); // toutes les routes de ce module nécessitent une connexion

/**
 * Le Conseiller IA est utilisable par deux profils, de deux façons
 * différentes — jamais l'un à la place de l'autre :
 * - un bénéficiaire (Mobile) ne consulte QUE sa propre situation, via
 *   /demander, /analyse, /historique (utilisateur connecté, pas d'id
 *   dans l'URL)
 * - la Responsable (Web) peut consulter la situation de N'IMPORTE QUEL
 *   bénéficiaire pendant l'instruction d'un dossier, via
 *   /beneficiaires/:id/demander|analyse|historique (répartition Web/Mobile
 *   confirmée par le président : le comité reste sur Mobile, ces routes
 *   Web-là ne lui sont donc pas ouvertes).
 */
function reserverAuBeneficiaire(req, res, next) {
  if (req.role !== 'BENEFICIAIRE') {
    return res.status(403).json({ message: 'Le Conseiller IA est réservé aux bénéficiaires.' });
  }
  next();
}

function reserverALaResponsable(req, res, next) {
  if (req.role !== 'RESPONSABLE') {
    return res.status(403).json({ message: 'Cette consultation du Conseiller IA est réservée à la Responsable.' });
  }
  next();
}

// --- Mobile : le bénéficiaire connecté consulte sa propre situation ---
router.post('/demander', reserverAuBeneficiaire, validerQuestion, conseillerIAController.demander);
router.post('/analyse', reserverAuBeneficiaire, conseillerIAController.analyser);
router.get('/historique', reserverAuBeneficiaire, conseillerIAController.consulterHistorique);

// --- Web : la Responsable consulte la situation d'un bénéficiaire choisi ---
router.post('/beneficiaires/:id/demander', reserverALaResponsable, validerQuestion, conseillerIAController.demanderPourBeneficiaire);
router.post('/beneficiaires/:id/analyse', reserverALaResponsable, conseillerIAController.analyserPourBeneficiaire);
router.get('/beneficiaires/:id/historique', reserverALaResponsable, conseillerIAController.consulterHistoriquePourBeneficiaire);

module.exports = router;
