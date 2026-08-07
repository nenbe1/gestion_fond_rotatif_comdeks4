function validerCanton(req, res, next) {
  const { nom, latitude, longitude } = req.body;
  const erreurs = [];
  if (!nom || nom.trim().length < 2) erreurs.push('Le nom du canton est requis (2 caractères minimum).');
  if (latitude !== undefined && latitude !== null && (latitude < -90 || latitude > 90)) erreurs.push('Latitude invalide.');
  if (longitude !== undefined && longitude !== null && (longitude < -180 || longitude > 180)) erreurs.push('Longitude invalide.');
  if (erreurs.length > 0) return res.status(400).json({ erreurs });
  next();
}

function validerFonction(req, res, next) {
  const { code, libelle } = req.body;
  const erreurs = [];
  if (!code || !/^[A-Z_]{2,30}$/.test(code.toUpperCase())) {
    erreurs.push('Le code doit contenir uniquement des lettres majuscules et underscores (2 à 30 caractères).');
  }
  if (!libelle || libelle.trim().length < 2) erreurs.push('Le libellé est requis (2 caractères minimum).');
  if (erreurs.length > 0) return res.status(400).json({ erreurs });
  next();
}

function validerLibelleFonction(req, res, next) {
  const { libelle } = req.body;
  if (!libelle || libelle.trim().length < 2) {
    return res.status(400).json({ erreurs: ['Le libellé est requis (2 caractères minimum).'] });
  }
  next();
}

function validerHabilitation(req, res, next) {
  const { code, libelle } = req.body;
  const erreurs = [];
  if (!code || !/^[A-Z_]{2,50}$/.test(code.toUpperCase())) {
    erreurs.push('Le code doit contenir uniquement des lettres majuscules et underscores (2 à 50 caractères).');
  }
  if (!libelle || libelle.trim().length < 2) erreurs.push('Le libellé est requis (2 caractères minimum).');
  if (erreurs.length > 0) return res.status(400).json({ erreurs });
  next();
}

function validerListeHabilitations(req, res, next) {
  const { habilitation_ids } = req.body;
  if (!Array.isArray(habilitation_ids)) {
    return res.status(400).json({ erreurs: ['habilitation_ids doit être une liste.'] });
  }
  next();
}

module.exports = { validerCanton, validerFonction, validerLibelleFonction, validerHabilitation, validerListeHabilitations };
