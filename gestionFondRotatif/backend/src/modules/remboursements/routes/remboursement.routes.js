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

// AJOUT : la décision finale sur un remboursement collectif (une fois le
// circuit du comité terminé) est réservée à la Responsable — même
// principe que la décision sur une demande de financement.
function reserverAResponsable(req, res, next) {
  if (req.role !== 'RESPONSABLE') {
    return res.status(403).json({ message: 'Seule la Responsable du Fond Rotatif peut décider sur un remboursement collectif.' });
  }
  next();
}

// La confirmation (double validation) d'un remboursement individuel suit
// le système d'habilitations (Paramétrage > Fonctions) plutôt qu'une
// fonction figée en dur — voir habilitation.middleware.js.
router.post('/individuel', reserverAuComite, validerCreationIndividuel, remboursementController.creerIndividuel);
router.put('/individuel/:id/confirmer', reserverParHabilitation('CONFIRMER_REMBOURSEMENT'), remboursementController.confirmerIndividuel);
router.put('/individuel/:id/rejeter', reserverParHabilitation('CONFIRMER_REMBOURSEMENT'), remboursementController.rejeterIndividuel);
router.get('/individuel/attribution/:attributionId', remboursementController.consulterIndividuelParAttribution);

// Niveau collectif — création + consultation par le comité, décision
// finale par la Responsable une fois son circuit interne terminé.
// IMPORTANT : la route '/collectif/en-attente-responsable' doit être
// déclarée AVANT '/collectif/:id', sinon Express la confondrait avec un
// id de remboursement.
router.post('/collectif', reserverAuComite, validerCreationCollectif, remboursementController.creerCollectif);
router.get('/collectif/en-attente-responsable', reserverAResponsable, remboursementController.consulterCollectifEnAttenteResponsable);
router.get('/collectif/financement/:financementId', remboursementController.consulterCollectifParFinancement);
router.get('/collectif/:id', remboursementController.consulterCollectifParId);
router.put('/collectif/:id/decision-responsable', reserverAResponsable, remboursementController.decisionResponsable);

module.exports = router;
