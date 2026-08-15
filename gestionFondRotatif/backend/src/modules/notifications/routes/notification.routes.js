const express = require('express');
const router = express.Router();

const notificationController = require('../controller/notification.controller');
const { verifierToken } = require('../../../middlewares/auth.middleware');

/**
 * Routes du module Notification — toutes protégées par authentification.
 * Aucune restriction de rôle : chaque compte (Responsable, comité,
 * bénéficiaire, Autorité) ne voit et ne gère jamais que ses propres
 * notifications, automatiquement filtrées sur req.utilisateurId — jamais
 * un id transmis par le client.
 */
router.use(verifierToken);

router.get('/', notificationController.consulterMoi);
router.get('/non-lues/nombre', notificationController.compterNonLues);
router.put('/toutes/lues', notificationController.marquerToutesLues);
router.put('/:id/lue', notificationController.marquerLue);

module.exports = router;
