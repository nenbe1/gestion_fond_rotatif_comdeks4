const db = require('../../../config/db');
const penaliteRepository = require('../repository/penalite_retard.repository');
const notificationService = require('../../notifications/service/notification.service');
const PenaliteRetard = require('../model/penalite_retard.model');

function erreur(message, statusCode) {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
}

/** Même logique que rapport.service.js — traduit l'utilisateur connecté en id responsable_fond_rotatif. */
async function resoudreResponsableId(utilisateurId) {
  const [rows] = await db.query(
    'SELECT id FROM responsable_fond_rotatif WHERE utilisateur_id = ? LIMIT 1',
    [utilisateurId]
  );
  if (!rows[0]) {
    throw erreur("L'utilisateur connecté n'est pas la Responsable du Fond Rotatif.", 403);
  }
  return rows[0].id;
}

async function consulterEnAttente() {
  const rows = await penaliteRepository.findEnAttente();
  return rows.map(PenaliteRetard.fromRow);
}

/**
 * decision = 'Validee' ou 'Rejetee'.
 * En cas de validation, le bénéficiaire est notifié — c'est le seul
 * moment où la pénalité devient visible pour lui ; tant qu'elle n'est
 * que 'Proposee', c'est une simple estimation interne côté Responsable.
 * Rien n'est ajouté ici au montant réellement dû dans attribution_
 * financement : le montant validé est communiqué au bénéficiaire, à
 * régler comme le reste de sa dette (même circuit de remboursement
 * individuel que d'habitude).
 */
async function decider(id, decision, utilisateurId) {
  if (!['Validee', 'Rejetee'].includes(decision)) {
    throw erreur("decision doit être 'Validee' ou 'Rejetee'.", 400);
  }
  const row = await penaliteRepository.findById(id);
  if (!row) throw erreur('Pénalité introuvable.', 404);
  if (row.statut !== 'Proposee') throw erreur("Cette pénalité n'est plus en attente de décision.", 409);

  const responsableId = await resoudreResponsableId(utilisateurId);
  const misAJour = await penaliteRepository.decider(id, decision, responsableId);

  if (decision === 'Validee') {
    await notificationService.envoyer(
      row.beneficiaire_utilisateur_id,
      'Pénalité de retard appliquée',
      `Une pénalité de ${Number(row.montant_propose).toLocaleString('fr-FR')} FCFA a été appliquée pour retard de remboursement sur ${row.code_financement}, à régler avec le solde restant dû.`
    );
  }

  return PenaliteRetard.fromRow(misAJour);
}

module.exports = { consulterEnAttente, decider };
