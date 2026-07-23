const express = require('express');
const router = express.Router();

const rapportController = require('../controller/rapport.controller');
const { validerGeneration } = require('../validator/rapport.validator');
const { verifierToken } = require('../../../middlewares/auth.middleware');

/**
 * Routes du module Rapport — toutes protégées par authentification (JWT).
 *   POST /api/rapports      -> génère un nouvel instantané (Responsable uniquement)
 *   GET  /api/rapports      -> liste tous les rapports déjà générés
 *   GET  /api/rapports/:id  -> détail d'un rapport
 */
router.use(verifierToken);

router.post('/', validerGeneration, rapportController.generer);
router.get('/', rapportController.consulterTous);
router.get('/:id', rapportController.consulterParId);

module.exports = router;
