const notificationRepository = require('../repository/notification.repository');
const Notification = require('../model/notification.model');

/**
 * Envoie une notification à un utilisateur précis. Fonction générique
 * utilisée par tous les points de branchement (attribution, remboursement,
 * décision sur une demande...). Ne lève jamais d'erreur bloquante pour
 * l'action métier en cours : si l'envoi échoue, on log et on continue —
 * une notification manquée ne doit jamais faire échouer une attribution
 * de financement ou une confirmation de remboursement.
 */
async function envoyer(utilisateurId, titre, message) {
  if (!utilisateurId) return; // pas de destinataire résolu (ex: bénéficiaire sans compte) — silencieux
  try {
    await notificationRepository.create(utilisateurId, titre, message);
  } catch (erreur) {
    console.error('Échec envoi notification (ignoré, ne bloque pas l\'action en cours) :', erreur.message);
  }
}

/** Notifie le membre du comité qui a soumis une demande — utilisé quand elle est validée ou rejetée, à n'importe quelle étape du circuit. */
async function envoyerAuSoumissionnaireDemande(demandeId, titre, message) {
  const utilisateurId = await notificationRepository.trouverSoumissionnaireDemande(demandeId);
  await envoyer(utilisateurId, titre, message);
}

/** Notifie tous les comptes Responsable — utilisé pour une nouvelle demande à traiter. */
async function envoyerATousLesResponsables(titre, message) {
  const ids = await notificationRepository.trouverTousLesResponsables();
  await Promise.all(ids.map((id) => envoyer(id, titre, message)));
}

async function consulterMesNotifications(utilisateurId) {
  const rows = await notificationRepository.findByUtilisateurId(utilisateurId);
  return rows.map(Notification.fromRow);
}

async function compterNonLues(utilisateurId) {
  return notificationRepository.compterNonLues(utilisateurId);
}

async function marquerLue(id, utilisateurId) {
  await notificationRepository.marquerLue(id, utilisateurId);
}

async function marquerToutesLues(utilisateurId) {
  await notificationRepository.marquerToutesLues(utilisateurId);
}

module.exports = {
  envoyer, envoyerAuSoumissionnaireDemande, envoyerATousLesResponsables,
  consulterMesNotifications, compterNonLues, marquerLue, marquerToutesLues,
};
