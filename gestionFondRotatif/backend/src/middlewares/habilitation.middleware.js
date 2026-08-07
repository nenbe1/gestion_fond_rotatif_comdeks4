const db = require('../config/db');

/**
 * Middleware générique de contrôle d'accès par HABILITATION — au lieu de
 * vérifier un rôle/fonction en dur (ex: "fonction_code === 'TRESORIER'"),
 * on vérifie que la fonction de la personne connectée a bien
 * l'habilitation demandée, cochée dans Paramétrage > Fonctions.
 *
 * Concerne uniquement les membres du comité (seule "Fonction" a des
 * habilitations, voir schema_mmf.sql) — les autres rôles (Responsable,
 * Autorité, Bénéficiaire) continuent d'utiliser leurs propres
 * restrictions (reserverAResponsable, etc.), non concernés par ce
 * système de fonction/habilitation.
 *
 * @param {string} codeHabilitation - ex: 'CONFIRMER_REMBOURSEMENT'
 */
function reserverParHabilitation(codeHabilitation) {
  return async function (req, res, next) {
    if (req.role !== 'MEMBRE_COMITE') {
      return res.status(403).json({ message: "Cette action est réservée à un membre du comité disposant de l'habilitation requise." });
    }

    const [rows] = await db.query(
      `SELECT 1
       FROM membre_comite mc
       INNER JOIN fonction_habilitation fh ON fh.fonction_id = mc.fonction_id
       INNER JOIN habilitation h ON h.id = fh.habilitation_id
       WHERE mc.utilisateur_id = ? AND h.code = ?
       LIMIT 1`,
      [req.utilisateurId, codeHabilitation]
    );

    if (rows.length === 0) {
      return res.status(403).json({
        message: `Votre fonction n'a pas l'habilitation "${codeHabilitation}" (configurable dans Paramétrage > Fonctions).`,
      });
    }

    next();
  };
}

module.exports = { reserverParHabilitation };
