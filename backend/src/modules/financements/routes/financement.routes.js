const express = require('express');
const router = express.Router();

const financementController = require('../controller/financement.controller');
const { verifierToken } = require('../../../middlewares/auth.middleware');

router.use(verifierToken);

router.get('/', financementController.consulterTous);
router.get('/:id', financementController.consulterParId);

module.exports = router;
