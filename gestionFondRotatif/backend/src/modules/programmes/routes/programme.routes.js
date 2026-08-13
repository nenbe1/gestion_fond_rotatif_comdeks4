const express = require('express');
const router = express.Router();

const programmeController = require('../controller/programme.controller');
const { validerCreation } = require('../validator/programme.validator');
const { verifierToken } = require('../../../middlewares/auth.middleware');

// CORRECTION : POST n'était protégé par aucune restriction de rôle avant
// — n'importe quel compte connecté (même un bénéficiaire) aurait pu
// créer un programme. Réservé maintenant à la Responsable, comme le
// reste de la configuration système (cantons, fonctions, paramètres).
function reserverAResponsable(req, res, next) {
  if (req.role !== 'RESPONSABLE') {
    return res.status(403).json({ message: 'Seule la Responsable du Fond Rotatif peut créer un programme.' });
  }
  next();
}

/**
 * Routes du module Programme — toutes protégées par authentification (JWT).
 *   GET  /api/programmes      -> liste
 *   GET  /api/programmes/:id  -> détail
 *   POST /api/programmes      -> création (Responsable uniquement)
 */
router.use(verifierToken);

router.get('/', programmeController.consulterTous);
router.get('/:id', programmeController.consulterParId);
router.post('/', reserverAResponsable, validerCreation, programmeController.creer);

module.exports = router;
