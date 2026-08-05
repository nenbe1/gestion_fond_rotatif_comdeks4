const express = require('express');
const router = express.Router();

const parametreController = require('../controller/parametre.controller');
const { validerCreation, validerModification } = require('../validator/parametre.validator');
const { verifierToken } = require('../../../middlewares/auth.middleware');

/**
 * Routes du module Parametre — toutes protégées par authentification (JWT).
 *   GET  /api/parametres          -> liste
 *   GET  /api/parametres/cle/:cle -> consultation par clé
 *   POST /api/parametres          -> création
 *   PUT  /api/parametres/:id      -> modification de la valeur
 */
router.use(verifierToken);

router.get('/', parametreController.consulterTous);
router.get('/cle/:cle', parametreController.consulterParCle);
router.post('/', validerCreation, parametreController.creer);
router.put('/:id', validerModification, parametreController.modifier);

module.exports = router;
