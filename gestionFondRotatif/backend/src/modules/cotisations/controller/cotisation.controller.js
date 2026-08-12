const cotisationService = require('../service/cotisation.service');
const membreComiteRepository = require('../../membres_comite/repository/membre_comite.repository');
const beneficiaireRepository = require('../../beneficiaires/repository/beneficiaire.repository');
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

// CORRECTION : rechercher() n'imposait aucune restriction — n'importe
// quel compte connecté pouvait consulter les cotisations de n'importe
// quel bénéficiaire via ?beneficiaire_id=<autre id>. Un bénéficiaire ne
// voit désormais que ses propres cotisations (son beneficiaire_id est
// forcé, tout paramètre reçu du client est ignoré pour ce rôle).
/** GET /api/cotisations — historique/recherche. Filtres en query string : groupe_id, beneficiaire_id, date_debut, date_fin. */
async function rechercher(req, res) {
  try {
    let cantonId;
    let beneficiaireId = req.query.beneficiaire_id;

    if (req.role === 'MEMBRE_COMITE') {
      const membre = await membreComiteRepository.findByUtilisateurId(req.utilisateurId);
      cantonId = membre?.canton_id;
    } else if (req.role === 'BENEFICIAIRE') {
      const beneficiaire = await beneficiaireRepository.findByUtilisateurId(req.utilisateurId);
      if (!beneficiaire) return res.status(403).json({ message: 'Compte bénéficiaire introuvable.' });
      beneficiaireId = beneficiaire.id; // écrase toute valeur envoyée par le client
    }

    const cotisations = await cotisationService.rechercher({
      cantonId,
      groupeId: req.query.groupe_id,
      beneficiaireId,
      dateDebut: req.query.date_debut,
      dateFin: req.query.date_fin,
    });
    res.status(200).json({ cotisations });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

// CORRECTION : même souci sur consulterParId et telechargerRecu — aucune
// vérification que la cotisation demandée appartient bien au
// bénéficiaire connecté. Un bénéficiaire ne peut désormais accéder qu'à
// ses propres cotisations (403 sinon) ; la Responsable et le comité
// gardent un accès complet.
async function verifierAccesBeneficiaire(req, cotisation) {
  if (req.role !== 'BENEFICIAIRE') return true;
  const beneficiaire = await beneficiaireRepository.findByUtilisateurId(req.utilisateurId);
  return !!beneficiaire && beneficiaire.id === cotisation.beneficiaireId;
}

async function consulterParId(req, res) {
  try {
    const cotisation = await cotisationService.consulterParId(req.params.id);
    if (!(await verifierAccesBeneficiaire(req, cotisation))) {
      return res.status(403).json({ message: 'Vous ne pouvez consulter que vos propres cotisations.' });
    }
    res.status(200).json({ cotisation });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** GET /api/cotisations/:id/recu — télécharge le reçu PDF. */
async function telechargerRecu(req, res) {
  try {
    const cotisation = await cotisationService.consulterParId(req.params.id);
    if (!(await verifierAccesBeneficiaire(req, cotisation))) {
      return res.status(403).json({ message: 'Vous ne pouvez consulter que vos propres cotisations.' });
    }
    if (cotisation.annulee) {
      return res.status(409).json({ message: 'Cette cotisation est annulée, son reçu ne peut plus être téléchargé.' });
    }
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

/** PUT /api/cotisations/:id — modifie montant et/ou observation. Réservé au comité, comme la création. */
async function modifier(req, res) {
  try {
    if (req.role !== 'MEMBRE_COMITE') {
      return res.status(403).json({ message: 'Seul un membre du comité peut modifier une cotisation.' });
    }
    const cotisation = await cotisationService.modifier(req.params.id, req.body);
    res.status(200).json({ cotisation });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** PUT /api/cotisations/:id/annuler — annule (ne supprime jamais). Réservé au comité, comme la création. */
async function annuler(req, res) {
  try {
    if (req.role !== 'MEMBRE_COMITE') {
      return res.status(403).json({ message: 'Seul un membre du comité peut annuler une cotisation.' });
    }
    const cotisation = await cotisationService.annuler(req.params.id, req.body?.motif);
    res.status(200).json({ cotisation });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

module.exports = { creer, rechercher, consulterParId, telechargerRecu, consulterTotal, modifier, annuler };
