const express = require('express');
const router = express.Router();

const administrationController = require('../controller/administration.controller');
const { verifierToken } = require('../../../middlewares/auth.middleware');

/**
 * Routes du module Administration — toutes protégées par authentification,
 * ET réservées à la Responsable (vérifié dans le service, pas seulement
 * ici, voir administration.service.js).
 *   GET /api/administration/utilisateurs -> vue unifiée de tous les comptes
 *   GET /api/administration/sauvegarde   -> télécharge un export SQL des données
 */
router.use(verifierToken);

router.get('/utilisateurs', administrationController.consulterUtilisateurs);
router.get('/sauvegarde', administrationController.telechargerSauvegarde);

module.exports = router;
