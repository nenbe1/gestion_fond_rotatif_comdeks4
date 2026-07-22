const express = require('express');
const router = express.Router();

const remboursementController = require('../controller/remboursement.controller');
const { validerCreationIndividuel, validerCreationCollectif } = require('../validator/remboursement.validator');
const { verifierToken } = require('../../../middlewares/auth.middleware');

router.use(verifierToken);

// Niveau individuel
router.post('/individuel', validerCreationIndividuel, remboursementController.creerIndividuel);
router.get('/individuel/attribution/:attributionId', remboursementController.consulterIndividuelParAttribution);

// Niveau collectif
router.post('/collectif', validerCreationCollectif, remboursementController.creerCollectif);
router.get('/collectif/financement/:financementId', remboursementController.consulterCollectifParFinancement);
router.get('/collectif/:id', remboursementController.consulterCollectifParId);

module.exports = router;
