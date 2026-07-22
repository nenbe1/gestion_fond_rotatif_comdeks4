const remboursementService = require('../service/remboursement.service');

async function creerIndividuel(req, res) {
  try {
    const remboursement = await remboursementService.creerIndividuel(req.body);
    res.status(201).json({ remboursement });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function consulterIndividuelParAttribution(req, res) {
  try {
    const remboursements = await remboursementService.consulterIndividuelParAttribution(req.params.attributionId);
    res.status(200).json({ remboursements });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function creerCollectif(req, res) {
  try {
    const remboursement = await remboursementService.creerCollectif(req.body);
    res.status(201).json({ remboursement });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function consulterCollectifParFinancement(req, res) {
  try {
    const remboursements = await remboursementService.consulterCollectifParFinancement(req.params.financementId);
    res.status(200).json({ remboursements });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function consulterCollectifParId(req, res) {
  try {
    const remboursement = await remboursementService.consulterCollectifParId(req.params.id);
    res.status(200).json({ remboursement });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

module.exports = {
  creerIndividuel, consulterIndividuelParAttribution,
  creerCollectif, consulterCollectifParFinancement, consulterCollectifParId,
};
