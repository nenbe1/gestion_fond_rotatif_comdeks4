const express = require('express');
const router = express.Router();

const domaineController = require('../controller/domaine.controller');
const { validerCreation } = require('../validator/domaine.validator');
const { verifierToken } = require('../../../middlewares/auth.middleware');

// CORRECTION : POST n'était protégé par aucune restriction de rôle avant
// — n'importe quel compte connecté aurait pu créer un domaine. Réservé
// maintenant à la Responsable, comme le reste de la configuration système.
function reserverAResponsable(req, res, next) {
  if (req.role !== 'RESPONSABLE') {
    return res.status(403).json({ message: 'Seule la Responsable du Fond Rotatif peut créer un domaine.' });
  }
  next();
}

/**
 * Routes du module Domaine — toutes protégées par authentification (JWT).
 *   GET  /api/domaines       -> liste
 *   GET  /api/domaines/:id   -> détail
 *   POST /api/domaines       -> création (Responsable uniquement)
 */
router.use(verifierToken);

router.get('/', domaineController.consulterTous);
router.get('/:id', domaineController.consulterParId);
router.post('/', reserverAResponsable, validerCreation, domaineController.creer);

module.exports = router;
