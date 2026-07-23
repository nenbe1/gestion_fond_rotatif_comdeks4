const express = require('express');
const router = express.Router();

const domaineController = require('../controller/domaine.controller');
const { validerCreation } = require('../validator/domaine.validator');
const { verifierToken } = require('../../../middlewares/auth.middleware');

/**
 * Routes du module Domaine — toutes protégées par authentification (JWT).
 *   GET  /api/domaines       -> liste
 *   GET  /api/domaines/:id   -> détail
 *   POST /api/domaines       -> création
 */
router.use(verifierToken);

router.get('/', domaineController.consulterTous);
router.get('/:id', domaineController.consulterParId);
router.post('/', validerCreation, domaineController.creer);

module.exports = router;
