const express = require('express');
const router = express.Router();

const demandeController = require('../controller/demande_financement.controller');
const { validerCreation } = require('../validator/demande_financement.validator');
const { verifierToken } = require('../../../middlewares/auth.middleware');

router.use(verifierToken);

router.post('/', validerCreation, demandeController.creer);
router.get('/', demandeController.consulterTous);
router.get('/:id', demandeController.consulterParId);
router.put('/:id/decision-responsable', demandeController.decisionResponsable);

module.exports = router;
