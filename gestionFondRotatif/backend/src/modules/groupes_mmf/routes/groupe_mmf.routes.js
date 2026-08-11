const express = require('express');
const router = express.Router();

const controller = require('../controller/groupe_mmf.controller');
const { validerCreation, validerAjoutMembre, validerResponsable } = require('../validator/groupe_mmf.validator');
const { verifierToken } = require('../../../middlewares/auth.middleware');

router.use(verifierToken);

/**
 * Un groupe MMF est créé et géré sur le terrain par le comité (comme les
 * bénéficiaires) — jamais depuis le Web. La Responsable garde un accès
 * en lecture (consulterTous/consulterParId/consulterMembres, sans
 * restriction de canton).
 */
function reserverAuComite(req, res, next) {
  if (req.role !== 'MEMBRE_COMITE') {
    return res.status(403).json({ message: 'Seul un membre du comité peut gérer les groupes MMF.' });
  }
  next();
}

router.post('/', reserverAuComite, validerCreation, controller.creer);
router.get('/', controller.consulterTous);
router.get('/mes-groupes', controller.mesGroupes);
router.get('/:id', controller.consulterParId);
router.put('/:id', reserverAuComite, validerCreation, controller.modifierNom);
router.put('/:id/desactiver', reserverAuComite, controller.desactiver);
router.put('/:id/activer', reserverAuComite, controller.activer);

router.get('/:id/membres', controller.consulterMembres);
router.post('/:id/membres', reserverAuComite, validerAjoutMembre, controller.ajouterMembre);
router.delete('/:id/membres/:adhesionId', reserverAuComite, controller.retirerMembre);

router.put('/:id/responsable', reserverAuComite, validerResponsable, controller.definirResponsable);

module.exports = router;
