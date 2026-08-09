const express = require('express');
const router = express.Router();

const rapportController = require('../controller/rapport.controller');
const { validerGeneration } = require('../validator/rapport.validator');
const { verifierToken } = require('../../../middlewares/auth.middleware');
const { verifierHabilitation } = require('../../../middlewares/habilitation.middleware');

/**
 * Routes du module Rapport — toutes protégées par authentification (JWT).
 *   POST   /api/rapports      -> génère un nouvel instantané (Responsable ou habilité GENERER_RAPPORT)
 *   GET    /api/rapports      -> liste tous les rapports déjà générés
 *   GET    /api/rapports/:id  -> détail d'un rapport
 *   DELETE /api/rapports/:id  -> supprime un rapport (Responsable ou habilité SUPPRIMER_RAPPORT)
 *
 * CORRECTION : generer() et supprimer() n'étaient protégés par aucune
 * restriction avant (n'importe quel compte connecté pouvait générer ou
 * supprimer un rapport). Passent maintenant par verifierHabilitation,
 * qui laisse toujours passer la Responsable et vérifie sinon la
 * fonction du membre du comité connecté.
 */
router.use(verifierToken);

router.post('/', verifierHabilitation('GENERER_RAPPORT'), validerGeneration, rapportController.generer);
router.get('/', rapportController.consulterTous);
router.get('/remboursements-par-canton', rapportController.consulterRemboursementsParCanton);
router.get('/:id', rapportController.consulterParId);
router.delete('/:id', verifierHabilitation('SUPPRIMER_RAPPORT'), rapportController.supprimer);

module.exports = router;
