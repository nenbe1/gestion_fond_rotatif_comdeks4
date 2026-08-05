const financementService = require('../service/financement.service');
const membreComiteRepository = require('../../membres_comite/repository/membre_comite.repository');

async function consulterTous(req, res) {
  try {
    let cantonId;
    if (req.role === 'MEMBRE_COMITE') {
      const membre = await membreComiteRepository.findByUtilisateurId(req.utilisateurId);
      cantonId = membre?.canton_id;
    }
    const financements = await financementService.consulterTous(cantonId);
    res.status(200).json({ financements });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function consulterParId(req, res) {
  try {
    const financement = await financementService.consulterParId(req.params.id);
    res.status(200).json({ financement });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** PUT /api/financements/:id — modifie programme / fonds / montant (Responsable uniquement). */
async function modifier(req, res) {
  try {
    const financement = await financementService.modifier(req.utilisateurId, req.params.id, {
      programme_id: req.body.programme_id,
      fond_rotatif_id: req.body.fond_rotatif_id,
      montant_financement: req.body.montant_financement,
    });
    res.status(200).json({ financement });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** DELETE /api/financements/:id — supprime un financement sans répartition (Responsable uniquement). */
async function supprimer(req, res) {
  try {
    await financementService.supprimer(req.utilisateurId, req.params.id);
    res.status(204).send();
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

module.exports = { consulterTous, consulterParId, modifier, supprimer };
