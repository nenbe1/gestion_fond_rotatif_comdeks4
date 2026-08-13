const express = require('express');
const router = express.Router();

const fondRotatifController = require('../controller/fond_rotatif.controller');
const { validerCreation, validerAlimentation } = require('../validator/fond_rotatif.validator');
const { verifierToken } = require('../../../middlewares/auth.middleware');

// CORRECTION : aucune de ces routes n'était protégée par un rôle avant
// — n'importe quel compte connecté aurait pu créer un fonds ou, plus
// grave, créditer manuellement son solde ("alimenter") sans contrôle.
// Réservé maintenant à la Responsable.
function reserverAResponsable(req, res, next) {
  if (req.role !== 'RESPONSABLE') {
    return res.status(403).json({ message: 'Seule la Responsable du Fond Rotatif peut gérer le fonds rotatif.' });
  }
  next();
}

/**
 * Routes du module FondRotatif — toutes protégées par authentification (JWT).
 *   GET  /api/fond-rotatif               -> liste
 *   GET  /api/fond-rotatif/:id           -> détail
 *   POST /api/fond-rotatif               -> création (Responsable uniquement)
 *   PUT  /api/fond-rotatif/:id/alimenter -> crédit manuel du solde (Responsable uniquement)
 */
router.use(verifierToken);

router.get('/', fondRotatifController.consulterTous);
router.get('/:id', fondRotatifController.consulterParId);
router.post('/', reserverAResponsable, validerCreation, fondRotatifController.creer);
router.put('/:id/alimenter', reserverAResponsable, validerAlimentation, fondRotatifController.alimenter);

module.exports = router;
