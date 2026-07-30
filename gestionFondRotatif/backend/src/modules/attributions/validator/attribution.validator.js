function validerCreation(req, res, next) {
  const { financement_id, beneficiaire_id, montant_attribue } = req.body;
  const erreurs = [];

  if (!financement_id) erreurs.push('financement_id est requis.');
  if (!beneficiaire_id) erreurs.push('beneficiaire_id est requis.');
  if (montant_attribue === undefined || Number(montant_attribue) <= 0) {
    erreurs.push('montant_attribue doit être positif.');
  }

  if (erreurs.length > 0) {
    return res.status(400).json({ erreurs });
  }
  next();
}

module.exports = { validerCreation };
