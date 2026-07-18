const express = require('express');
const router = express.Router();

const validationController = require('../controller/validation.controller');
const { validerTraitement } = require('../validator/validation.validator');
const { verifierToken } = require('../../../middlewares/auth.middleware');

router.use(verifierToken);

router.get('/demande/:demandeId', validationController.consulterCircuitDemande);
router.put('/:id/traiter', validerTraitement, validationController.traiterEtape);

module.exports = router;
