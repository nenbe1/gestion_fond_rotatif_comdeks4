const beneficiaireService = require('../service/beneficiaire.service');
const membreComiteRepository = require('../../membres_comite/repository/membre_comite.repository');

/**
 * Un bénéficiaire est enregistré par un membre du comité (route déjà
 * réservée à ce rôle) — son canton est automatiquement celui du membre
 * qui l'enregistre, jamais choisi manuellement (garantit qu'un
 * bénéficiaire est toujours rattaché au bon comité local).
 */
async function creer(req, res) {
  try {
    const membre = await membreComiteRepository.findByUtilisateurId(req.utilisateurId);
    const beneficiaire = await beneficiaireService.creer({ ...req.body, canton_id: membre?.canton_id });
    res.status(201).json({ beneficiaire });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** Un membre du comité ne voit que les bénéficiaires de son propre canton ; la Responsable/Administration voit tout. */
async function consulterTous(req, res) {
  try {
    let cantonId;
    if (req.role === 'MEMBRE_COMITE') {
      const membre = await membreComiteRepository.findByUtilisateurId(req.utilisateurId);
      cantonId = membre?.canton_id;
    }
    const beneficiaires = await beneficiaireService.consulterTous(cantonId);
    res.status(200).json({ beneficiaires });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function consulterParId(req, res) {
  try {
    const beneficiaire = await beneficiaireService.consulterParId(req.params.id);
    res.status(200).json({ beneficiaire });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function modifier(req, res) {
  try {
    const beneficiaire = await beneficiaireService.modifier(req.params.id, req.body);
    res.status(200).json({ beneficiaire });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** AJOUT : DELETE /api/beneficiaires/:id — réservé au comité et à la Responsable (voir routes). */
async function supprimer(req, res) {
  try {
    await beneficiaireService.supprimer(req.params.id);
    res.status(204).send();
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function recalculerStatut(req, res) {
  try {
    const statut = await beneficiaireService.recalculerStatutMMF(req.params.id);
    res.status(200).json({ statutMMF: statut });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** GET /api/beneficiaires/moi/compte — pour le Mobile : le bénéficiaire consulte son propre compte. */
async function consulterMonCompte(req, res) {
  try {
    const compte = await beneficiaireService.consulterMonCompte(req.utilisateurId);
    res.status(200).json({ compte });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/**
 * POST /api/beneficiaires/:id/photo — upload de la photo (multipart,
 * champ "photo", voir upload.middleware.js et beneficiaire.routes.js).
 * req.file est fourni par multer ; absent → aucune photo envoyée.
 */
async function uploaderPhoto(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucune photo reçue (champ "photo" attendu).' });
    }
    const cheminPhoto = `/uploads/beneficiaires/${req.file.filename}`;
    const compte = await beneficiaireService.mettreAJourPhoto(req.params.id, cheminPhoto);
    res.status(200).json({ compte });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

module.exports = { creer, consulterTous, consulterParId, modifier, supprimer, recalculerStatut, consulterMonCompte, uploaderPhoto };
