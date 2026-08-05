const express = require('express');
const router = express.Router();

const beneficiaireController = require('../controller/beneficiaire.controller');
const { validerCreation, validerModification } = require('../validator/beneficiaire.validator');
const { verifierToken } = require('../../../middlewares/auth.middleware');

router.use(verifierToken); // toutes les routes de ce module nécessitent une connexion

/** Un bénéficiaire n'est enregistré que par un membre du comité, sur le terrain (jamais depuis le Web). */
function reserverAuComite(req, res, next) {
  if (req.role !== 'MEMBRE_COMITE') {
    return res.status(403).json({ message: 'Seul un membre du comité peut enregistrer un bénéficiaire.' });
  }
  next();
}

router.post('/', reserverAuComite, validerCreation, beneficiaireController.creer);
router.get('/', beneficiaireController.consulterTous);
router.get('/moi/compte', beneficiaireController.consulterMonCompte);
router.get('/:id', beneficiaireController.consulterParId);
router.put('/:id', validerModification, beneficiaireController.modifier);
router.post('/:id/recalculer-statut', beneficiaireController.recalculerStatut);

module.exports = router;
