const db = require('../../../config/db');
const validationRepository = require('../repository/validation.repository');
const membreComiteRepository = require('../../membres_comite/repository/membre_comite.repository');

const LIBELLE_NIVEAU = {
  TRESORIER: 'Trésorier',
  COMMISSAIRE: 'Commissaire aux comptes',
  PRESIDENT: 'Président du comité',
};

function erreur(message, statusCode) {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
}

async function majStatutDemande(demandeId, statut) {
  await db.query('UPDATE demande_financement SET statut_global = ? WHERE id = ?', [statut, demandeId]);
}

/**
 * Résout le canton du dossier concerné par une étape du circuit — via la
 * demande directement, ou via financement -> demande si c'est un
 * remboursement collectif. Renvoie null si le comité initiateur n'a pas
 * de canton renseigné (ancienne donnée incomplète) — dans ce cas on ne
 * bloque pas, par tolérance, plutôt que de bloquer tout le monde sur une
 * donnée manquante qu'aucun membre ne peut corriger lui-même.
 */
async function resoudreCantonDuDossier(ligne) {
  if (ligne.demande_financement_id) {
    const [rows] = await db.query(
      `SELECT mc.canton_id
       FROM demande_financement d
       INNER JOIN membre_comite mc ON mc.id = d.membre_comite_id
       WHERE d.id = ?`,
      [ligne.demande_financement_id]
    );
    return rows[0]?.canton_id ?? null;
  }
  if (ligne.remboursement_collectif_id) {
    const [rows] = await db.query(
      `SELECT mc.canton_id
       FROM remboursement_collectif rc
       INNER JOIN financement f ON f.id = rc.financement_id
       INNER JOIN demande_financement d ON d.id = f.demande_financement_id
       INNER JOIN membre_comite mc ON mc.id = d.membre_comite_id
       WHERE rc.id = ?`,
      [ligne.remboursement_collectif_id]
    );
    return rows[0]?.canton_id ?? null;
  }
  return null;
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
async function traiterEtape(validationId, { decision, commentaire, membre_comite_id, fonction_code, canton_id }) {
  if (!['Approuve', 'Rejete'].includes(decision)) {
    throw erreur("La décision doit être 'Approuve' ou 'Rejete'.", 400);
  }

  const ligne = await validationRepository.findById(validationId);
  if (!ligne) throw erreur('Étape de validation introuvable.', 404);
  if (ligne.statut !== 'EnAttente') throw erreur('Cette étape a déjà été traitée.', 409);

  if (ligne.niveau !== fonction_code) {
    throw erreur(
      `Cette étape doit être traitée par le ${LIBELLE_NIVEAU[ligne.niveau] || ligne.niveau} — votre fonction ne correspond pas.`,
      403
    );
  }

  const cantonDuDossier = await resoudreCantonDuDossier(ligne);
  if (cantonDuDossier !== null && cantonDuDossier !== canton_id) {
    throw erreur("Ce dossier appartient à un autre canton — vous ne pouvez traiter que les dossiers de votre propre comité.", 403);
  }

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
  } else if (ligne.remboursement_collectif_id) {
    // require() différé ici (plutôt qu'en haut du fichier) uniquement
    // pour garder ce fichier autonome à lire ; pas de dépendance
    // circulaire (remboursement.service n'importe pas validation.service).
    const remboursementService = require('../../remboursements/service/remboursement.service');
    if (decision === 'Rejete') {
      await remboursementService.rejeterApresValidation(ligne.remboursement_collectif_id);
    } else if (decision === 'Approuve' && ligne.ordre === validationRepository.NIVEAUX.length - 1) {
      await remboursementService.confirmerApresValidation(ligne.remboursement_collectif_id);
    }
  }

  return { validation: ligneTraitee };
}

async function consulterCircuitDemande(demandeId) {
  return validationRepository.findByDemandeId(demandeId);
}

async function consulterCircuitRemboursementCollectif(remboursementCollectifId) {
  return validationRepository.findByRemboursementCollectifId(remboursementCollectifId);
}

async function resoudreMembreComite(utilisateurId) {
  const membre = await membreComiteRepository.findByUtilisateurId(utilisateurId);
  if (!membre) {
    throw erreur("L'utilisateur connecté n'est pas membre d'un comité.", 403);
  }
  return membre; // inclut id et fonction_code
}

module.exports = { traiterEtape, consulterCircuitDemande, consulterCircuitRemboursementCollectif, resoudreMembreComite };
