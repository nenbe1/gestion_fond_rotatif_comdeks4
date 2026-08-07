const express = require('express');
const router = express.Router();

const parametreController = require('../controller/parametre.controller');
const { validerCreation, validerModification } = require('../validator/parametre.validator');
const { verifierToken } = require('../../../middlewares/auth.middleware');

// CORRECTION : POST/PUT n'étaient protégés par aucune restriction de
// rôle avant — n'importe quel compte connecté (même un bénéficiaire)
// aurait pu modifier le taux de majoration ou tout autre réglage
// global. Réservé maintenant à la Responsable, comme le reste de la
// configuration système (cantons, fonctions...). La lecture reste
// ouverte à tous (d'autres modules en ont besoin).
function reserverAResponsable(req, res, next) {
  if (req.role !== 'RESPONSABLE') {
    return res.status(403).json({ message: 'Seule la Responsable du Fond Rotatif peut modifier la configuration du système.' });
  }
  next();
}

/**
 * Routes du module Parametre — toutes protégées par authentification (JWT).
 *   GET  /api/parametres          -> liste
 *   GET  /api/parametres/cle/:cle -> consultation par clé
 *   POST /api/parametres          -> création (Responsable uniquement)
 *   PUT  /api/parametres/:id      -> modification de la valeur (Responsable uniquement)
 */
router.use(verifierToken);

router.get('/', parametreController.consulterTous);
router.get('/cle/:cle', parametreController.consulterParCle);
router.post('/', reserverAResponsable, validerCreation, parametreController.creer);
router.put('/:id', reserverAResponsable, validerModification, parametreController.modifier);

module.exports = router;
