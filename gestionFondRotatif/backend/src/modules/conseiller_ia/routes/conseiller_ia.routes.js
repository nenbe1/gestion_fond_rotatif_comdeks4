const express = require('express');
const router = express.Router();

const conseillerIAController = require('../controller/conseiller_ia.controller');
const { validerQuestion } = require('../validator/conseiller_ia.validator');
const { verifierToken } = require('../../../middlewares/auth.middleware');

router.use(verifierToken); // toutes les routes de ce module nécessitent une connexion

/** Le Conseiller IA est réservé aux bénéficiaires — chacun ne consulte que sa propre situation, jamais celle d'un autre. */
function reserverAuBeneficiaire(req, res, next) {
  if (req.role !== 'BENEFICIAIRE') {
    return res.status(403).json({ message: 'Le Conseiller IA est réservé aux bénéficiaires.' });
  }
  next();
}

router.use(reserverAuBeneficiaire);

router.post('/demander', validerQuestion, conseillerIAController.demander);
router.get('/historique', conseillerIAController.consulterHistorique);

module.exports = router;
