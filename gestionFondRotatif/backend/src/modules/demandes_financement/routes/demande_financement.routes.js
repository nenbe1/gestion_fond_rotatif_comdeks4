const express = require('express');
const router = express.Router();

const demandeController = require('../controller/demande_financement.controller');
const { validerCreation } = require('../validator/demande_financement.validator');
const { verifierToken } = require('../../../middlewares/auth.middleware');
const { verifierHabilitation } = require('../../../middlewares/habilitation.middleware');

router.use(verifierToken);

/** Seul le comité propose une demande — la Responsable ne fait que la valider ou la refuser. */
function reserverAuComite(req, res, next) {
  if (req.role !== 'MEMBRE_COMITE') {
    return res.status(403).json({ message: 'Seul un membre du comité peut créer une demande de financement.' });
  }
  next();
}

router.post('/', reserverAuComite, verifierHabilitation('CREER_DEMANDE_FINANCEMENT'), validerCreation, demandeController.creer);
router.get('/', demandeController.consulterTous);
router.get('/:id', demandeController.consulterParId);
router.get('/:id/beneficiaires-prevus', demandeController.consulterBeneficiairesPrevus);
router.put('/:id/decision-responsable', demandeController.decisionResponsable);

module.exports = router;
