function validerCreation(req, res, next) {
  const { nom } = req.body;
  if (!nom || nom.trim().length < 2) {
    return res.status(400).json({ erreurs: ['Le nom du groupe est requis (2 caractères minimum).'] });
  }
  next();
}

function validerAjoutMembre(req, res, next) {
  if (!req.body.beneficiaire_id) {
    return res.status(400).json({ erreurs: ['beneficiaire_id est requis.'] });
  }
  next();
}

function validerResponsable(req, res, next) {
  if (!req.body.beneficiaire_id) {
    return res.status(400).json({ erreurs: ['beneficiaire_id est requis.'] });
  }
  next();
}

module.exports = { validerCreation, validerAjoutMembre, validerResponsable };
