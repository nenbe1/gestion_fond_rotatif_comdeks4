const express = require('express');
const router = express.Router();

const autoriteController = require('../controller/autorite.controller');
const { validerCreation, validerModification } = require('../validator/autorite.validator');
const { verifierToken } = require('../../../middlewares/auth.middleware');

router.use(verifierToken); // toutes les routes de ce module nécessitent une connexion

// Doit être déclaré avant '/:id' pour ne pas être intercepté par cette route.
router.get('/moi/statistiques', autoriteController.consulterMesStatistiques);

router.post('/', validerCreation, autoriteController.creer);
router.get('/', autoriteController.consulterTous);
router.get('/:id', autoriteController.consulterParId);
router.put('/:id', validerModification, autoriteController.modifier);

module.exports = router;
