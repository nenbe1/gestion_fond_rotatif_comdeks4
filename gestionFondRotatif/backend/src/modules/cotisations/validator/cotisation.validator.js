function validerCreation(req, res, next) {
  const { groupe_mmf_id, beneficiaire_id, montant } = req.body;
  const erreurs = [];
  if (!groupe_mmf_id) erreurs.push('groupe_mmf_id est requis.');
  if (!beneficiaire_id) erreurs.push('beneficiaire_id est requis.');
  if (!montant || Number(montant) <= 0) erreurs.push('Le montant doit être un nombre positif.');
  if (erreurs.length > 0) return res.status(400).json({ erreurs });
  next();
}

module.exports = { validerCreation };
