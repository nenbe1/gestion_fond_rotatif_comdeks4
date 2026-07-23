/** Valide les données d'entrée pour la création d'un fonds rotatif. */
function validerCreation(req, res, next) {
  const { code_fond, libelle_fond } = req.body;
  const erreurs = [];
  if (!code_fond) erreurs.push('code_fond est requis.');
  if (!libelle_fond) erreurs.push('libelle_fond est requis.');
  if (erreurs.length > 0) return res.status(400).json({ erreurs });
  next();
}

/** Valide le montant fourni pour une opération d'alimentation du fonds. */
function validerAlimentation(req, res, next) {
  const { montant } = req.body;
  if (montant === undefined || Number(montant) <= 0) {
    return res.status(400).json({ erreurs: ['Le montant doit être positif.'] });
  }
  next();
}

module.exports = { validerCreation, validerAlimentation };
