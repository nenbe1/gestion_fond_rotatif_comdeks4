const cron = require('node-cron');
const remboursementRepository = require('../modules/remboursements/repository/remboursement.repository');
const attributionRepository = require('../modules/attributions/repository/attribution.repository');
const parametreRepository = require('../modules/parametrage/repository/parametre.repository');
const penaliteRepository = require('../modules/penalites_retard/repository/penalite_retard.repository');

/**
 * Calcule/actualise chaque jour une pénalité de retard PROPOSÉE (jamais
 * appliquée automatiquement) pour chaque bénéficiaire dont le
 * financement a au moins une échéance collective dépassée et non
 * soldée. La Responsable valide ou rejette chaque proposition au cas
 * par cas (voir modules/penalites_retard).
 *
 * Montant restant dû du bénéficiaire = sa part attribuée moins ce qu'il
 * a déjà remboursé et confirmé (aucun échéancier individuel n'existe
 * dans le système, seul le montant total attribué est suivi).
 * Montant proposé = montant restant dû x taux (%) x nombre de semaines
 * de retard du financement (une échéance collective en retard = une
 * semaine). Tant qu'une proposition n'a pas été tranchée par la
 * Responsable, elle est mise à jour en place (pas de doublon).
 */
async function calculerPenalitesRetard() {
  const parametreTaux = await parametreRepository.findByCle('taux_penalite_retard');
  const taux = parametreTaux ? Number(parametreTaux.valeur) : 0;
  if (taux <= 0) return 0;

  const financementsEnRetard = await remboursementRepository.findFinancementsEnRetard();
  let nombreTraite = 0;

  for (const { financement_id: financementId, semaines_retard: semainesRetard } of financementsEnRetard) {
    const attributions = await attributionRepository.findByFinancementId(financementId);

    for (const attribution of attributions) {
      const montantRembourse = await attributionRepository.sommeRembourseePourAttribution(attribution.id);
      const montantRestantDu = Number(attribution.montant_attribue) - montantRembourse;
      if (montantRestantDu <= 0) continue; // déjà soldé, rien à proposer

      const montantPropose = Math.round(montantRestantDu * (taux / 100) * semainesRetard);

      const existante = await penaliteRepository.findProposeeParAttribution(attribution.id);
      if (existante) {
        await penaliteRepository.mettreAJourProposition(existante.id, {
          semaines_retard: semainesRetard, montant_restant_du: montantRestantDu, montant_propose: montantPropose,
        });
      } else {
        await penaliteRepository.create({
          attribution_financement_id: attribution.id,
          semaines_retard: semainesRetard, montant_restant_du: montantRestantDu, montant_propose: montantPropose,
        });
      }
      nombreTraite += 1;
    }
  }
  return nombreTraite;
}

/** Même heure que les rappels d'échéance (7h00), juste après eux. */
function planifierPenalitesRetard() {
  cron.schedule('5 7 * * *', () => {
    calculerPenalitesRetard().catch((err) => console.error('Erreur job pénalités de retard :', err));
  });
}

module.exports = { calculerPenalitesRetard, planifierPenalitesRetard };
