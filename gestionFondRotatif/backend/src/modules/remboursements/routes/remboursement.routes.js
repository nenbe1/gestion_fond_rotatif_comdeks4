const express = require('express');
const router = express.Router();

const remboursementController = require('../controller/remboursement.controller');
const { validerCreationIndividuel, validerCreationCollectif } = require('../validator/remboursement.validator');
const { verifierToken } = require('../../../middlewares/auth.middleware');
const { reserverParHabilitation } = require('../../../middlewares/habilitation.middleware');

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

// CORRECTION : la confirmation (double validation) était réservée en dur
// au Trésorier ("fonction_code === 'TRESORIER'"). Elle passe maintenant
// par le système d'habilitations (Paramétrage > Fonctions) : n'importe
// quelle fonction ayant l'habilitation CONFIRMER_REMBOURSEMENT cochée
// peut confirmer — plus besoin de modifier le code pour changer cette
// règle, juste une case à cocher.
router.post('/individuel', reserverAuComite, validerCreationIndividuel, remboursementController.creerIndividuel);
router.put('/individuel/:id/confirmer', reserverParHabilitation('CONFIRMER_REMBOURSEMENT'), remboursementController.confirmerIndividuel);
router.put('/individuel/:id/rejeter', reserverParHabilitation('CONFIRMER_REMBOURSEMENT'), remboursementController.rejeterIndividuel);
router.get('/individuel/attribution/:attributionId', remboursementController.consulterIndividuelParAttribution);

// Niveau collectif (inchangé)
router.post('/collectif', reserverAuComite, validerCreationCollectif, remboursementController.creerCollectif);
router.get('/collectif/financement/:financementId', remboursementController.consulterCollectifParFinancement);
router.get('/collectif/:id', remboursementController.consulterCollectifParId);

module.exports = router;
