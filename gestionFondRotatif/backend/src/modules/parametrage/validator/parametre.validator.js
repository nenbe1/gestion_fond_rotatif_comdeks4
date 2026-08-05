/** Valide les données d'entrée pour la création d'un paramètre. */
function validerCreation(req, res, next) {
  const { cle, valeur } = req.body;
  const erreurs = [];
  if (!cle || cle.trim().length < 2) erreurs.push('La clé du paramètre est requise.');
  if (valeur === undefined || valeur === null || valeur === '') erreurs.push('La valeur du paramètre est requise.');
  if (erreurs.length > 0) return res.status(400).json({ erreurs });
  next();
}

/** Valide la nouvelle valeur fournie pour la modification d'un paramètre. */
function validerModification(req, res, next) {
  const { valeur } = req.body;
  if (valeur === undefined || valeur === null || valeur === '') {
    return res.status(400).json({ erreurs: ['La nouvelle valeur est requise.'] });
  }
  next();
}

module.exports = { validerCreation, validerModification };
