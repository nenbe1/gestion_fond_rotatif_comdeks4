const express = require('express');
const router = express.Router();

const programmeController = require('../controller/programme.controller');
const { validerCreation } = require('../validator/programme.validator');
const { verifierToken } = require('../../../middlewares/auth.middleware');

/**
 * Routes du module Programme — toutes protégées par authentification (JWT).
 *   GET  /api/programmes      -> liste
 *   GET  /api/programmes/:id  -> détail
 *   POST /api/programmes      -> création
 */
router.use(verifierToken);

router.get('/', programmeController.consulterTous);
router.get('/:id', programmeController.consulterParId);
router.post('/', validerCreation, programmeController.creer);

module.exports = router;
