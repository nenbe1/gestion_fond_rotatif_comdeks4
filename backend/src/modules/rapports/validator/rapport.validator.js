/**
 * Valide les données d'entrée pour la génération d'un rapport.
 * La cohérence des dates (fin après début) est revérifiée ici en plus du
 * service, pour renvoyer une erreur claire dès la validation d'entrée.
 */
function validerGeneration(req, res, next) {
  const { periode_debut, periode_fin } = req.body;
  const erreurs = [];

  if (!periode_debut) erreurs.push('periode_debut est requise (format YYYY-MM-DD).');
  if (!periode_fin) erreurs.push('periode_fin est requise (format YYYY-MM-DD).');
  if (periode_debut && periode_fin && new Date(periode_fin) <= new Date(periode_debut)) {
    erreurs.push('periode_fin doit être postérieure à periode_debut.');
  }

  if (erreurs.length > 0) return res.status(400).json({ erreurs });
  next();
}

module.exports = { validerGeneration };
