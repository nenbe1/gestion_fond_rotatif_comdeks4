const express = require('express');
const router = express.Router();

const membreComiteController = require('../controller/membre_comite.controller');
const { validerCreation, validerModification } = require('../validator/membre_comite.validator');
const { verifierToken } = require('../../../middlewares/auth.middleware');

router.use(verifierToken);

// Routes de référence à déclarer AVANT /:id (sinon Express interprète
// "reference" comme une valeur de :id).
router.get('/reference/fonctions', membreComiteController.listerFonctions);
router.get('/reference/cantons', membreComiteController.listerCantons);

router.post('/', validerCreation, membreComiteController.creer);
router.get('/', membreComiteController.consulterTous);
router.get('/:id', membreComiteController.consulterParId);
router.put('/:id', validerModification, membreComiteController.modifier);

module.exports = router;
