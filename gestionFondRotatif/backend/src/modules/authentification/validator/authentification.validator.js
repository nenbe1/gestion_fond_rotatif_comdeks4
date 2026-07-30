function validerInscription(req, res, next) {
  const { nom, prenom, sexe, telephone, mot_de_passe } = req.body;
  const erreurs = [];

  if (!nom || nom.trim().length < 2) erreurs.push('Le nom est requis (2 caractères minimum).');
  if (!prenom || prenom.trim().length < 2) erreurs.push('Le prénom est requis (2 caractères minimum).');
  if (!sexe || !['M', 'F'].includes(sexe)) erreurs.push("Le sexe doit être 'M' ou 'F'.");
  if (!telephone || !/^\+?[0-9]{8,15}$/.test(telephone)) erreurs.push('Numéro de téléphone invalide.');
  if (!mot_de_passe || mot_de_passe.length < 6) erreurs.push('Le mot de passe doit contenir au moins 6 caractères.');

  if (erreurs.length > 0) {
    return res.status(400).json({ erreurs });
  }
  next();
}

function validerConnexion(req, res, next) {
  const { telephone, mot_de_passe } = req.body;
  const erreurs = [];

  if (!telephone) erreurs.push('Le numéro de téléphone est requis.');
  if (!mot_de_passe) erreurs.push('Le mot de passe est requis.');

  if (erreurs.length > 0) {
    return res.status(400).json({ erreurs });
  }
  next();
}

module.exports = { validerInscription, validerConnexion };
