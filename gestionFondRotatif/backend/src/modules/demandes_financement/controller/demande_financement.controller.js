const demandeService = require('../service/demande_financement.service');
const membreComiteRepository = require('../../membres_comite/repository/membre_comite.repository');

async function creer(req, res) {
  try {
    const membreComiteId = await demandeService.resoudreMembreComiteId(req.utilisateurId);
    const { beneficiaires_prevus, ...data } = req.body;
    const demande = await demandeService.creer(data, membreComiteId, beneficiaires_prevus || []);
    res.status(201).json({ demande });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function consulterBeneficiairesPrevus(req, res) {
  try {
    const beneficiairesPrevus = await demandeService.consulterBeneficiairesPrevus(req.params.id);
    res.status(200).json({ beneficiairesPrevus });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

// CORRECTION : quand c'est la Responsable qui consulte (role
// RESPONSABLE), on exclut desormais les demandes encore "EnCours"
// (circuit du comite pas termine) directement au niveau de la requete
// SQL - elles ne doivent jamais apparaitre pour elle, meme dans un
// onglet "toutes les demandes".
async function consulterTous(req, res) {
  try {
    let cantonId;
    let exclureEnCours = false;

    if (req.role === 'MEMBRE_COMITE') {
      const membre = await membreComiteRepository.findByUtilisateurId(req.utilisateurId);
      cantonId = membre?.canton_id;
    } else if (req.role === 'RESPONSABLE') {
      exclureEnCours = true;
    }

    const demandes = await demandeService.consulterTous(cantonId, exclureEnCours);
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

module.exports = { creer, consulterTous, consulterParId, consulterBeneficiairesPrevus, decisionResponsable };
