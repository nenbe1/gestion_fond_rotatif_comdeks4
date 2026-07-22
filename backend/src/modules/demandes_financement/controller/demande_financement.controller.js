const demandeService = require('../service/demande_financement.service');

async function creer(req, res) {
  try {
    const demande = await demandeService.creer(req.body);
    res.status(201).json({ demande });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function consulterTous(req, res) {
  try {
    const demandes = await demandeService.consulterTous();
    res.status(200).json({ demandes });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function consulterParId(req, res) {
  try {
    const demande = await demandeService.consulterParId(req.params.id);
    res.status(200).json({ demande });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function decisionResponsable(req, res) {
  try {
    const responsableId = await demandeService.resoudreResponsableId(req.utilisateurId);
    const resultat = await demandeService.decisionResponsable(
      req.params.id,
      {
        decision: req.body.decision,
        fond_rotatif_id: req.body.fond_rotatif_id,
        programme_id: req.body.programme_id,
      },
      responsableId
    );
    res.status(200).json(resultat);
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

module.exports = { creer, consulterTous, consulterParId, decisionResponsable };
