const express = require('express');
const router = express.Router();

const attributionController = require('../controller/attribution.controller');
const { validerCreation } = require('../validator/attribution.validator');
const { verifierToken } = require('../../../middlewares/auth.middleware');

router.use(verifierToken);

/** C'est le comité qui répartit un financement entre les bénéficiaires, jamais un bénéficiaire lui-même. */
function reserverAuComite(req, res, next) {
  if (req.role !== 'MEMBRE_COMITE') {
    return res.status(403).json({ message: 'Seul un membre du comité peut répartir un financement entre les bénéficiaires.' });
  }
  next();
}

router.post('/', reserverAuComite, validerCreation, attributionController.creer);
router.get('/financement/:financementId', attributionController.consulterParFinancement);
router.get('/:id', attributionController.consulterParId);
router.get('/:id/reste-a-payer', attributionController.resteAPayer);

module.exports = router;
