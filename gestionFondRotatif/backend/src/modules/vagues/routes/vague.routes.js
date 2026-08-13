const express = require('express');
const router = express.Router();

const vagueController = require('../controller/vague.controller');
const { validerCreation } = require('../validator/vague.validator');
const { verifierToken } = require('../../../middlewares/auth.middleware');

// CORRECTION : aucune de ces routes n'était protégée par un rôle avant
// — n'importe quel compte connecté aurait pu créer/démarrer/clôturer
// une vague. Réservé maintenant à la Responsable.
function reserverAResponsable(req, res, next) {
  if (req.role !== 'RESPONSABLE') {
    return res.status(403).json({ message: 'Seule la Responsable du Fond Rotatif peut gérer les vagues.' });
  }
  next();
}

/**
 * Routes du module Vague — toutes protégées par authentification (JWT).
 *   GET  /api/vagues              -> liste
 *   GET  /api/vagues/:id          -> détail
 *   POST /api/vagues              -> création (Responsable uniquement, statut initial "Planifiee")
 *   PUT  /api/vagues/:id/demarrer -> passe en "EnCours" (Responsable uniquement)
 *   PUT  /api/vagues/:id/cloturer -> passe en "Cloturee" (Responsable uniquement)
 */
router.use(verifierToken);

router.get('/', vagueController.consulterTous);
router.get('/:id', vagueController.consulterParId);
router.post('/', reserverAResponsable, validerCreation, vagueController.creer);
router.put('/:id/demarrer', reserverAResponsable, vagueController.demarrer);
router.put('/:id/cloturer', reserverAResponsable, vagueController.cloturer);

module.exports = router;
