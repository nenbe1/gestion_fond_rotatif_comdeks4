const express = require('express');
const router = express.Router();

const controller = require('../controller/parametrage.controller');
const {
  validerCanton, validerFonction, validerLibelleFonction,
  validerHabilitation, validerListeHabilitations,
} = require('../validator/parametrage.validator');
const { verifierToken } = require('../../../middlewares/auth.middleware');

router.use(verifierToken);

/**
 * La configuration du système (cantons, fonctions, habilitations) n'est
 * modifiable que par la Responsable — la lecture reste ouverte à tout
 * utilisateur connecté, plusieurs écrans (Mobile compris : listes
 * déroulantes cantons/fonctions) en ont besoin pour leurs formulaires.
 */
function reserverAResponsable(req, res, next) {
  if (req.role !== 'RESPONSABLE') {
    return res.status(403).json({ message: 'Seule la Responsable du Fond Rotatif peut modifier la configuration du système.' });
  }
  next();
}

// ---------- Cantons ----------
router.get('/cantons', controller.consulterCantons);
router.post('/cantons', reserverAResponsable, validerCanton, controller.creerCanton);
router.put('/cantons/:id', reserverAResponsable, validerCanton, controller.modifierCanton);
router.put('/cantons/:id/desactiver', reserverAResponsable, controller.desactiverCanton);
router.put('/cantons/:id/activer', reserverAResponsable, controller.activerCanton);

// ---------- Fonctions (+ leurs habilitations) ----------
router.get('/fonctions', controller.consulterFonctions);
router.post('/fonctions', reserverAResponsable, validerFonction, controller.creerFonction);
router.put('/fonctions/:id', reserverAResponsable, validerLibelleFonction, controller.modifierFonction);
router.delete('/fonctions/:id', reserverAResponsable, controller.supprimerFonction);
router.put('/fonctions/:id/habilitations', reserverAResponsable, validerListeHabilitations, controller.definirHabilitationsFonction);

// ---------- Habilitations ----------
router.get('/habilitations', controller.consulterHabilitations);
router.post('/habilitations', reserverAResponsable, validerHabilitation, controller.creerHabilitation);
router.delete('/habilitations/:id', reserverAResponsable, controller.supprimerHabilitation);

module.exports = router;
