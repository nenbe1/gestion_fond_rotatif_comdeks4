const express = require('express');
const router = express.Router();

const controller = require('../controller/cotisation.controller');
const { validerCreation, validerModification } = require('../validator/cotisation.validator');
const { verifierToken } = require('../../../middlewares/auth.middleware');

router.use(verifierToken);

/** Le bénéficiaire remet sa cotisation en main propre au comité, qui l'enregistre — jamais lui-même. */
function reserverAuComite(req, res, next) {
  if (req.role !== 'MEMBRE_COMITE') {
    return res.status(403).json({ message: 'Seul un membre du comité peut enregistrer une cotisation.' });
  }
  next();
}

router.post('/', reserverAuComite, validerCreation, controller.creer);
router.get('/', controller.rechercher);
router.get('/:id', controller.consulterParId);
router.get('/:id/recu', controller.telechargerRecu);
router.get('/total/:beneficiaireId/:groupeId', controller.consulterTotal);
router.put('/:id', reserverAuComite, validerModification, controller.modifier);
router.put('/:id/annuler', reserverAuComite, controller.annuler);

module.exports = router;
