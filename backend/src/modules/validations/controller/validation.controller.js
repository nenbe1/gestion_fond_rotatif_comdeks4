const validationService = require('../service/validation.service');

async function traiterEtape(req, res) {
  try {
    const membreComiteId = await validationService.resoudreMembreComiteId(req.utilisateurId);
    const resultat = await validationService.traiterEtape(req.params.id, {
      decision: req.body.decision,
      commentaire: req.body.commentaire,
      membre_comite_id: membreComiteId,
    });
    res.status(200).json(resultat);
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function consulterCircuitDemande(req, res) {
  try {
    const circuit = await validationService.consulterCircuitDemande(req.params.demandeId);
    res.status(200).json({ circuit });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

module.exports = { traiterEtape, consulterCircuitDemande };
