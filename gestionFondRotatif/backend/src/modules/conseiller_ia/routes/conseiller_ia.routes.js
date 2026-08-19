const express = require('express');
const router = express.Router();

const conseillerIAController = require('../controller/conseiller_ia.controller');
const { validerQuestion } = require('../validator/conseiller_ia.validator');
const { verifierToken } = require('../../../middlewares/auth.middleware');

router.use(verifierToken); // toutes les routes de ce module nécessitent une connexion

/**
 * Le Conseiller IA est utilisable par trois profils, de trois façons
 * différentes — jamais l'une à la place de l'autre :
 * - un bénéficiaire (Mobile) ne consulte QUE sa propre situation, via
 *   /demander, /analyse, /historique (utilisateur connecté, pas d'id
 *   dans l'URL)
 * - un membre du comité (Mobile) consulte la situation d'un bénéficiaire
 *   de SON canton, pendant l'instruction d'un dossier, via
 *   /beneficiaires/:id/demander|analyse|historique (vérifié dans le
 *   contrôleur : jamais un bénéficiaire d'un autre canton)
 * - la Responsable (Web) consulte la situation agrégée d'un canton
 *   entier — chaque canton ayant son propre membre du comité sur le
 *   terrain — via /cantons/:id/demander|analyse|historique
 */
function reserverAuBeneficiaire(req, res, next) {
  if (req.role !== 'BENEFICIAIRE') {
    return res.status(403).json({ message: 'Le Conseiller IA est réservé aux bénéficiaires.' });
  }
  next();
}

function reserverAuComite(req, res, next) {
  if (req.role !== 'MEMBRE_COMITE') {
    return res.status(403).json({ message: 'Cette consultation du Conseiller IA est réservée au comité.' });
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

// --- Mobile : le comité consulte un bénéficiaire de son propre canton ---
router.post('/beneficiaires/:id/demander', reserverAuComite, validerQuestion, conseillerIAController.demanderPourBeneficiaire);
router.post('/beneficiaires/:id/analyse', reserverAuComite, conseillerIAController.analyserPourBeneficiaire);
router.get('/beneficiaires/:id/historique', reserverAuComite, conseillerIAController.consulterHistoriquePourBeneficiaire);

// --- Web : la Responsable consulte la situation agrégée d'un canton ---
router.post('/cantons/:id/demander', reserverALaResponsable, validerQuestion, conseillerIAController.demanderPourCanton);
router.post('/cantons/:id/analyse', reserverALaResponsable, conseillerIAController.analyserPourCanton);
router.get('/cantons/:id/historique', reserverALaResponsable, conseillerIAController.consulterHistoriquePourCanton);

module.exports = router;
