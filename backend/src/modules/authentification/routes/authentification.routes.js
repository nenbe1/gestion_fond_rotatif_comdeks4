const express = require('express');
const router = express.Router();

const authentificationController = require('../controller/authentification.controller');
const { validerInscription, validerConnexion } = require('../validator/authentification.validator');

router.post('/inscription', validerInscription, authentificationController.inscrire);
router.post('/connexion', validerConnexion, authentificationController.connecter);

module.exports = router;
