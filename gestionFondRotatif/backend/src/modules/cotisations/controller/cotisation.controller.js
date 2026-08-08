const cotisationService = require('../service/cotisation.service');
const membreComiteRepository = require('../../membres_comite/repository/membre_comite.repository');
const { genererRecuCotisation } = require('../utils/recu_pdf');

async function creer(req, res) {
  try {
    const membre = await membreComiteRepository.findByUtilisateurId(req.utilisateurId);
    if (!membre) return res.status(403).json({ message: 'Seul un membre du comité peut enregistrer une cotisation.' });
    const cotisation = await cotisationService.creer(req.body, membre.id, membre.canton_id);
    res.status(201).json({ cotisation });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** GET /api/cotisations — historique/recherche. Filtres en query string : groupe_id, beneficiaire_id, date_debut, date_fin. */
async function rechercher(req, res) {
  try {
    let cantonId;
    if (req.role === 'MEMBRE_COMITE') {
      const membre = await membreComiteRepository.findByUtilisateurId(req.utilisateurId);
      cantonId = membre?.canton_id;
    }
    const cotisations = await cotisationService.rechercher({
      cantonId,
      groupeId: req.query.groupe_id,
      beneficiaireId: req.query.beneficiaire_id,
      dateDebut: req.query.date_debut,
      dateFin: req.query.date_fin,
    });
    res.status(200).json({ cotisations });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function consulterParId(req, res) {
  try {
    const cotisation = await cotisationService.consulterParId(req.params.id);
    res.status(200).json({ cotisation });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** GET /api/cotisations/:id/recu — télécharge le reçu PDF. */
async function telechargerRecu(req, res) {
  try {
    const cotisation = await cotisationService.consulterParId(req.params.id);
    genererRecuCotisation(res, cotisation);
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function consulterTotal(req, res) {
  try {
    const total = await cotisationService.consulterTotalBeneficiaireGroupe(req.params.beneficiaireId, req.params.groupeId);
    res.status(200).json({ total });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

module.exports = { creer, rechercher, consulterParId, telechargerRecu, consulterTotal };
