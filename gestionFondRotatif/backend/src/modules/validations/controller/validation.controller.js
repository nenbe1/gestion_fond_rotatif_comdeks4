const validationService = require('../service/validation.service');

async function traiterEtape(req, res) {
  try {
    const membre = await validationService.resoudreMembreComite(req.utilisateurId);
    const resultat = await validationService.traiterEtape(req.params.id, {
      decision: req.body.decision,
      commentaire: req.body.commentaire,
      membre_comite_id: membre.id,
      fonction_code: membre.fonction_code,
      canton_id: membre.canton_id,
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

async function consulterCircuitRemboursementCollectif(req, res) {
  try {
    const circuit = await validationService.consulterCircuitRemboursementCollectif(req.params.remboursementCollectifId);
    res.status(200).json({ circuit });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

module.exports = { traiterEtape, consulterCircuitDemande, consulterCircuitRemboursementCollectif };
