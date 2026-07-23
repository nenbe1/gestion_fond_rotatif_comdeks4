const express = require('express');
const router = express.Router();

const fondRotatifController = require('../controller/fond_rotatif.controller');
const { validerCreation, validerAlimentation } = require('../validator/fond_rotatif.validator');
const { verifierToken } = require('../../../middlewares/auth.middleware');

/**
 * Routes du module FondRotatif — toutes protégées par authentification (JWT).
 *   GET  /api/fond-rotatif               -> liste
 *   GET  /api/fond-rotatif/:id           -> détail
 *   POST /api/fond-rotatif               -> création
 *   PUT  /api/fond-rotatif/:id/alimenter -> crédit manuel du solde
 */
router.use(verifierToken);

router.get('/', fondRotatifController.consulterTous);
router.get('/:id', fondRotatifController.consulterParId);
router.post('/', validerCreation, fondRotatifController.creer);
router.put('/:id/alimenter', validerAlimentation, fondRotatifController.alimenter);

module.exports = router;
