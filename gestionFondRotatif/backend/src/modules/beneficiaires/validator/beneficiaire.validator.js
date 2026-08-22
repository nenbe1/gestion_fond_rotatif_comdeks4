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
  const { latitude, longitude, nom, prenom, telephone, sexe } = req.body;
  const erreurs = [];

  if (latitude !== undefined && (latitude < -90 || latitude > 90)) erreurs.push('Latitude invalide.');
  if (longitude !== undefined && (longitude < -180 || longitude > 180)) erreurs.push('Longitude invalide.');

  // AJOUT : identité modifiable (nom, prénom, téléphone, sexe) — tous
  // optionnels ici (le comité peut ne changer qu'âge/activité comme
  // avant), mais s'ils sont fournis ils doivent être valides.
  if (nom !== undefined && !nom.trim()) erreurs.push('Le nom ne peut pas être vide.');
  if (prenom !== undefined && !prenom.trim()) erreurs.push('Le prénom ne peut pas être vide.');
  if (telephone !== undefined && !telephone.trim()) erreurs.push('Le téléphone ne peut pas être vide.');
  if (sexe !== undefined && !['F', 'M'].includes(sexe)) erreurs.push('Sexe invalide (F ou M).');

  if (erreurs.length > 0) {
    return res.status(400).json({ erreurs });
  }
  next();
}

module.exports = { validerCreation, validerModification };
