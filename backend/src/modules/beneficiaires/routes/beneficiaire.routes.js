const express = require('express');
const router = express.Router();

const beneficiaireController = require('../controller/beneficiaire.controller');
const { validerCreation, validerModification } = require('../validator/beneficiaire.validator');
const { verifierToken } = require('../../../middlewares/auth.middleware');

router.use(verifierToken); // toutes les routes de ce module nécessitent une connexion

router.post('/', validerCreation, beneficiaireController.creer);
router.get('/', beneficiaireController.consulterTous);
router.get('/moi/compte', beneficiaireController.consulterMonCompte);
router.get('/:id', beneficiaireController.consulterParId);
router.put('/:id', validerModification, beneficiaireController.modifier);
router.post('/:id/recalculer-statut', beneficiaireController.recalculerStatut);

module.exports = router;
