const db = require('../config/db');

/**
 * Vérifie que le membre du comité connecté a bien l'habilitation demandée,
 * via la fonction à laquelle il est rattaché (table fonction_habilitation,
 * gérée depuis Paramétrage > Fonctions & habilitations).
 *
 * - La Responsable passe toujours (supervision totale du système) — elle
 *   n'a pas de fonction de comité et n'apparaît donc jamais dans cette
 *   table de toute façon.
 * - Un bénéficiaire ou une Autorité est toujours refusé ici : ce
 *   middleware ne concerne que les actions internes au comité.
 * - Un membre du comité dont la fonction n'a pas l'habilitation demandée
 *   reçoit un 403 explicite (précise l'habilitation manquante).
 *
 * À utiliser APRÈS un contrôle de rôle existant (ex: reserverAuComite),
 * jamais à la place : il affine la vérification, il ne la remplace pas.
 *
 * @param {string} code Code de l'habilitation requise (ex: 'GERER_BENEFICIAIRES').
 */
function verifierHabilitation(code) {
  return async function (req, res, next) {
    if (req.role === 'RESPONSABLE') return next();

    if (req.role !== 'MEMBRE_COMITE') {
      return res.status(403).json({ message: 'Cette action est réservée au comité ou à la Responsable.' });
    }

    try {
      const [rows] = await db.query(
        `SELECT h.id
         FROM membre_comite mc
         INNER JOIN fonction_habilitation fh ON fh.fonction_id = mc.fonction_id
         INNER JOIN habilitation h ON h.id = fh.habilitation_id
         WHERE mc.utilisateur_id = ? AND h.code = ?
         LIMIT 1`,
        [req.utilisateurId, code]
      );

      if (rows.length === 0) {
        return res.status(403).json({
          message: `Votre fonction ne dispose pas de l'habilitation requise pour cette action (${code}). Contactez la Responsable si vous pensez que c'est une erreur.`,
        });
      }
      next();
    } catch (erreur) {
      res.status(500).json({ message: erreur.message });
    }
  };
}

// Exportée sous deux noms : verifierHabilitation (utilisé dans les
// modules beneficiaires/demandes_financement/rapports/membres_comite)
// et reserverParHabilitation, alias identique attendu par
// remboursements/routes/remboursement.routes.js.
module.exports = { verifierHabilitation, reserverParHabilitation: verifierHabilitation };
