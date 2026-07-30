const db = require('../../../config/db');
const validationRepository = require('../repository/validation.repository');

function erreur(message, statusCode) {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
}

async function majStatutDemande(demandeId, statut) {
  await db.query('UPDATE demande_financement SET statut_global = ? WHERE id = ?', [statut, demandeId]);
}

/**
 * Traite une étape du circuit interne du comité (approuver ou rejeter).
 * Règle d'ordre : une étape ne peut être traitée que si la précédente
 * (ordre - 1) est déjà Approuve. La première étape (ordre 0) n'a pas
 * de prédécesseur.
 *
 * Important : l'approbation de la dernière étape (Président du comité,
 * ordre 2) ne crée PAS le Financement directement. Elle fait passer la
 * demande au statut "EnAttenteResponsable" — c'est la Responsable du Fond
 * Rotatif qui décide ensuite (voir demandes_financement.service.decisionResponsable),
 * avec un droit de refus. Le comité valide en interne, la Responsable
 * décide en dernier ressort.
 */
async function traiterEtape(validationId, { decision, commentaire, membre_comite_id }) {
  if (!['Approuve', 'Rejete'].includes(decision)) {
    throw erreur("La décision doit être 'Approuve' ou 'Rejete'.", 400);
  }

  const ligne = await validationRepository.findById(validationId);
  if (!ligne) throw erreur('Étape de validation introuvable.', 404);
  if (ligne.statut !== 'EnAttente') throw erreur('Cette étape a déjà été traitée.', 409);

  if (ligne.ordre > 0) {
    const soeurs = ligne.demande_financement_id
      ? await validationRepository.findByDemandeId(ligne.demande_financement_id)
      : await validationRepository.findByRemboursementCollectifId(ligne.remboursement_collectif_id);

    const precedente = soeurs.find((s) => s.ordre === ligne.ordre - 1);
    if (!precedente || precedente.statut !== 'Approuve') {
      throw erreur("L'étape précédente du circuit doit être approuvée avant celle-ci.", 409);
    }
  }

  const ligneTraitee = await validationRepository.traiter(validationId, {
    statut: decision,
    commentaire,
    membre_comite_id,
  });

  if (ligne.demande_financement_id) {
    if (decision === 'Rejete') {
      await majStatutDemande(ligne.demande_financement_id, 'Rejetee');
    } else if (decision === 'Approuve' && ligne.ordre === validationRepository.NIVEAUX.length - 1) {
      await majStatutDemande(ligne.demande_financement_id, 'EnAttenteResponsable');
    }
  }

  return { validation: ligneTraitee };
}

async function consulterCircuitDemande(demandeId) {
  return validationRepository.findByDemandeId(demandeId);
}

async function resoudreMembreComiteId(utilisateurId) {
  const [rows] = await db.query(
    'SELECT id FROM membre_comite WHERE utilisateur_id = ? LIMIT 1',
    [utilisateurId]
  );
  if (!rows[0]) {
    throw erreur("L'utilisateur connecté n'est pas membre d'un comité.", 403);
  }
  return rows[0].id;
}

module.exports = { traiterEtape, consulterCircuitDemande, resoudreMembreComiteId };
