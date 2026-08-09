const express = require('express');
const router = express.Router();

const membreComiteController = require('../controller/membre_comite.controller');
const { validerCreation, validerModification } = require('../validator/membre_comite.validator');
const { verifierToken } = require('../../../middlewares/auth.middleware');
const { verifierHabilitation } = require('../../../middlewares/habilitation.middleware');

router.use(verifierToken);

// CORRECTION : creer() et modifier() n'étaient protégés par AUCUNE
// restriction avant — n'importe quel compte connecté (même un
// bénéficiaire) aurait pu ajouter ou modifier un membre du comité.
// Réservé maintenant à la Responsable (gestion du comité) ou à un
// membre habilité GERER_MEMBRES_COMITE — aucune fonction ne l'a par
// défaut, seule la Responsable (qui contourne toujours ce contrôle,
// voir habilitation.middleware.js) peut donc agir ici tant que
// personne ne le lui attribue explicitement depuis Paramétrage.
function reserverAResponsableOuHabilite(req, res, next) {
  if (req.role !== 'RESPONSABLE' && req.role !== 'MEMBRE_COMITE') {
    return res.status(403).json({ message: 'Cette action est réservée à la Responsable ou au comité.' });
  }
  next();
}

// Routes de référence à déclarer AVANT /:id (sinon Express interprète
// "reference" comme une valeur de :id).
router.get('/reference/fonctions', membreComiteController.listerFonctions);
router.get('/reference/cantons', membreComiteController.listerCantons);
router.post('/reference/cantons', membreComiteController.creerCanton);

router.post('/', reserverAResponsableOuHabilite, verifierHabilitation('GERER_MEMBRES_COMITE'), validerCreation, membreComiteController.creer);
router.get('/', membreComiteController.consulterTous);
router.get('/:id', membreComiteController.consulterParId);
router.put('/:id', reserverAResponsableOuHabilite, verifierHabilitation('GERER_MEMBRES_COMITE'), validerModification, membreComiteController.modifier);

module.exports = router;
