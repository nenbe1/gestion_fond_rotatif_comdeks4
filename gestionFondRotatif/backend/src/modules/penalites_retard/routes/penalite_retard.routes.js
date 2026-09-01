const express = require('express');
const router = express.Router();

const penaliteController = require('../controller/penalite_retard.controller');
const { verifierToken } = require('../../../middlewares/auth.middleware');

router.use(verifierToken);

/** Réservé à la Responsable — même principe que pour les remboursements collectifs. */
function reserverAResponsable(req, res, next) {
  if (req.role !== 'RESPONSABLE') {
    return res.status(403).json({ message: 'Seule la Responsable du Fond Rotatif peut consulter ou décider des pénalités de retard.' });
  }
  next();
}

router.get('/en-attente', reserverAResponsable, penaliteController.consulterEnAttente);
router.put('/:id/decision', reserverAResponsable, penaliteController.decider);

module.exports = router;
