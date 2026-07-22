function validerCreationIndividuel(req, res, next) {
  const { attribution_financement_id, montant, date_versement } = req.body;
  const erreurs = [];

  if (!attribution_financement_id) erreurs.push('attribution_financement_id est requis.');
  if (montant === undefined || Number(montant) <= 0) erreurs.push('montant doit être positif.');
  if (!date_versement) erreurs.push('date_versement est requise.');

  if (erreurs.length > 0) return res.status(400).json({ erreurs });
  next();
}

function validerCreationCollectif(req, res, next) {
  const { financement_id, numero_semaine, date_prevue, montant_prevu } = req.body;
  const erreurs = [];

  if (!financement_id) erreurs.push('financement_id est requis.');
  if (numero_semaine === undefined || Number(numero_semaine) < 1) erreurs.push('numero_semaine doit être un entier positif.');
  if (!date_prevue) erreurs.push('date_prevue est requise.');
  if (montant_prevu === undefined || Number(montant_prevu) <= 0) erreurs.push('montant_prevu doit être positif.');

  if (erreurs.length > 0) return res.status(400).json({ erreurs });
  next();
}

module.exports = { validerCreationIndividuel, validerCreationCollectif };
