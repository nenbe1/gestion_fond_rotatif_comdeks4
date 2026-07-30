const express = require('express');
const router = express.Router();

const vagueController = require('../controller/vague.controller');
const { validerCreation } = require('../validator/vague.validator');
const { verifierToken } = require('../../../middlewares/auth.middleware');

/**
 * Routes du module Vague — toutes protégées par authentification (JWT).
 *   GET  /api/vagues              -> liste
 *   GET  /api/vagues/:id          -> détail
 *   POST /api/vagues              -> création (statut initial "Planifiee")
 *   PUT  /api/vagues/:id/demarrer -> passe en "EnCours"
 *   PUT  /api/vagues/:id/cloturer -> passe en "Cloturee"
 */
router.use(verifierToken);

router.get('/', vagueController.consulterTous);
router.get('/:id', vagueController.consulterParId);
router.post('/', validerCreation, vagueController.creer);
router.put('/:id/demarrer', vagueController.demarrer);
router.put('/:id/cloturer', vagueController.cloturer);

module.exports = router;
