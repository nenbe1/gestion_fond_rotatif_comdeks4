const cron = require('node-cron');
const remboursementRepository = require('../modules/remboursements/repository/remboursement.repository');
const membreComiteRepository = require('../modules/membres_comite/repository/membre_comite.repository');
const attributionRepository = require('../modules/attributions/repository/attribution.repository');
const notificationService = require('../modules/notifications/service/notification.service');

/**
 * Traite un lot d'échéances pour un type de rappel donné : alerte tous
 * les membres actifs du comité du canton concerné (pas seulement celui
 * qui a soumis la demande d'origine — la collecte est une responsabilité
 * de tout le comité local), ainsi que tous les bénéficiaires ayant reçu
 * une part de ce financement (l'échéance est celle du groupe, donc le
 * même rappel collectif leur est partagé), puis marque l'échéance comme
 * signalée pour ce rappel précis.
 */
async function traiterLot(echeances, titre, construireMessage, marquerEnvoye) {
  for (const echeance of echeances) {
    const message = construireMessage(echeance);

    const membres = await membreComiteRepository.findByCantonId(echeance.canton_id);
    const attributions = await attributionRepository.findByFinancementId(echeance.financement_id);

    const idsUtilisateurs = new Set([
      ...membres.map((m) => m.utilisateur_id),
      ...attributions.map((a) => a.beneficiaire_utilisateur_id),
    ]);

    await Promise.all([...idsUtilisateurs].map((id) => notificationService.envoyer(id, titre, message)));
    await marquerEnvoye(echeance.id);
  }
  return echeances.length;
}

function formaterEcheance(echeance) {
  return `Financement ${echeance.code_financement} : ${Number(echeance.montant_prevu).toLocaleString('fr-FR')} FCFA (semaine ${echeance.numero_semaine}).`;
}

/**
 * Vérifie les deux types de rappel à chaque exécution : à J-3 (prévenir
 * à l'avance) et le jour même de l'échéance (rappel final). Exportée
 * séparément de la planification pour pouvoir être appelée manuellement
 * (tests, déclenchement à la demande) sans dépendre de node-cron.
 */
async function verifierEcheancesAVenir() {
  const echeancesJ3 = await remboursementRepository.findEcheancesJMoins3();
  const nbJ3 = await traiterLot(
    echeancesJ3,
    'Échéance de remboursement dans 3 jours',
    (e) => `${formaterEcheance(e)} Prévu le ${new Date(e.date_prevue).toLocaleDateString('fr-FR')}.`,
    remboursementRepository.marquerRappelJMoins3Envoye
  );

  const echeancesJourJ = await remboursementRepository.findEcheancesJourJ();
  const nbJourJ = await traiterLot(
    echeancesJourJ,
    "Échéance de remboursement aujourd'hui",
    (e) => `${formaterEcheance(e)} C'est aujourd'hui le jour prévu.`,
    remboursementRepository.marquerRappelJourJEnvoye
  );

  if (nbJ3 > 0 || nbJourJ > 0) {
    console.log(`Rappels d'échéance : ${nbJ3} à J-3, ${nbJourJ} au jour J.`);
  }
}

/** Planifie la vérification tous les jours à 7h00 (heure du serveur). */
function planifierRappelsEcheance() {
  cron.schedule('0 7 * * *', () => {
    verifierEcheancesAVenir().catch((erreur) => {
      console.error('Échec de la vérification des échéances (job ignoré, réessaiera demain) :', erreur.message);
    });
  });
}

module.exports = { verifierEcheancesAVenir, planifierRappelsEcheance };
