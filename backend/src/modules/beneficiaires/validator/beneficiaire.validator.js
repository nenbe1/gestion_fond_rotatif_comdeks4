function validerCreation(req, res, next) {
  const { nom, prenom, sexe, telephone, mot_de_passe, latitude, longitude } = req.body;
  const erreurs = [];

  if (!nom || nom.trim().length < 2) erreurs.push('Le nom est requis (2 caractères minimum).');
  if (!prenom || prenom.trim().length < 2) erreurs.push('Le prénom est requis (2 caractères minimum).');
  if (!sexe || !['M', 'F'].includes(sexe)) erreurs.push("Le sexe doit être 'M' ou 'F'.");
  if (!telephone || !/^\+?[0-9]{8,15}$/.test(telephone)) erreurs.push('Numéro de téléphone invalide.');
  if (!mot_de_passe || mot_de_passe.length < 6) erreurs.push('Le mot de passe doit contenir au moins 6 caractères.');

  if (latitude !== undefined && (latitude < -90 || latitude > 90)) erreurs.push('Latitude invalide.');
  if (longitude !== undefined && (longitude < -180 || longitude > 180)) erreurs.push('Longitude invalide.');

  if (erreurs.length > 0) {
    return res.status(400).json({ erreurs });
  }
  next();
}

function validerModification(req, res, next) {
  const { latitude, longitude } = req.body;
  const erreurs = [];

  if (latitude !== undefined && (latitude < -90 || latitude > 90)) erreurs.push('Latitude invalide.');
  if (longitude !== undefined && (longitude < -180 || longitude > 180)) erreurs.push('Longitude invalide.');

  if (erreurs.length > 0) {
    return res.status(400).json({ erreurs });
  }
  next();
}

module.exports = { validerCreation, validerModification };
