const remboursementService = require('../service/remboursement.service');
const membreComiteRepository = require('../../membres_comite/repository/membre_comite.repository');

async function creerIndividuel(req, res) {
  try {
    const membre = await membreComiteRepository.findByUtilisateurId(req.utilisateurId);
    const remboursement = await remboursementService.creerIndividuel(req.body, membre?.canton_id);
    res.status(201).json({ remboursement });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** AJOUT : PUT /api/remboursements/individuel/:id/confirmer — double validation, Trésorier uniquement. */
async function confirmerIndividuel(req, res) {
  try {
    const membre = await membreComiteRepository.findByUtilisateurId(req.utilisateurId);
    const remboursement = await remboursementService.confirmerIndividuel(req.params.id, membre?.canton_id);
    res.status(200).json({ remboursement });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** AJOUT : PUT /api/remboursements/individuel/:id/rejeter — corrige une erreur de saisie avant confirmation. */
async function rejeterIndividuel(req, res) {
  try {
    const membre = await membreComiteRepository.findByUtilisateurId(req.utilisateurId);
    const remboursement = await remboursementService.rejeterIndividuel(req.params.id, membre?.canton_id);
    res.status(200).json({ remboursement });
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
    const membre = await membreComiteRepository.findByUtilisateurId(req.utilisateurId);
    const remboursement = await remboursementService.creerCollectif(req.body, membre?.canton_id);
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
  creerIndividuel, confirmerIndividuel, rejeterIndividuel, consulterIndividuelParAttribution,
  creerCollectif, consulterCollectifParFinancement, consulterCollectifParId,
};
