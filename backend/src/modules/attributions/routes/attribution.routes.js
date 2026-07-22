const express = require('express');
const router = express.Router();

const attributionController = require('../controller/attribution.controller');
const { validerCreation } = require('../validator/attribution.validator');
const { verifierToken } = require('../../../middlewares/auth.middleware');

router.use(verifierToken);

router.post('/', validerCreation, attributionController.creer);
router.get('/financement/:financementId', attributionController.consulterParFinancement);
router.get('/:id', attributionController.consulterParId);
router.get('/:id/reste-a-payer', attributionController.resteAPayer);

module.exports = router;
