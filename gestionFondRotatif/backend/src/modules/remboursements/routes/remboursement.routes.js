const express = require('express');
const router = express.Router();

const remboursementController = require('../controller/remboursement.controller');
const { validerCreationIndividuel, validerCreationCollectif } = require('../validator/remboursement.validator');
const { verifierToken } = require('../../../middlewares/auth.middleware');

router.use(verifierToken);

/**
 * Le bénéficiaire remet l'argent physiquement au comité ; c'est le
 * comité qui l'enregistre ensuite dans le système (jamais le bénéficiaire
 * lui-même, qui n'a qu'un accès en lecture à son propre historique).
 */
function reserverAuComite(req, res, next) {
  if (req.role !== 'MEMBRE_COMITE') {
    return res.status(403).json({ message: 'Seul un membre du comité peut enregistrer un remboursement.' });
  }
  next();
}

// Niveau individuel
router.post('/individuel', reserverAuComite, validerCreationIndividuel, remboursementController.creerIndividuel);
router.get('/individuel/attribution/:attributionId', remboursementController.consulterIndividuelParAttribution);

// Niveau collectif
router.post('/collectif', reserverAuComite, validerCreationCollectif, remboursementController.creerCollectif);
router.get('/collectif/financement/:financementId', remboursementController.consulterCollectifParFinancement);
router.get('/collectif/:id', remboursementController.consulterCollectifParId);

module.exports = router;
