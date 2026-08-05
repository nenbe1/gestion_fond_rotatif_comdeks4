function validerCreation(req, res, next) {
  const { nom, prenom, sexe, telephone, mot_de_passe, fonction_id, canton_id } = req.body;
  const erreurs = [];

  if (!nom || nom.trim().length < 2) erreurs.push('Le nom est requis (2 caractères minimum).');
  if (!prenom || prenom.trim().length < 2) erreurs.push('Le prénom est requis (2 caractères minimum).');
  if (!sexe || !['M', 'F'].includes(sexe)) erreurs.push("Le sexe doit être 'M' ou 'F'.");
  if (!telephone || !/^\+?[0-9]{8,15}$/.test(telephone)) erreurs.push('Numéro de téléphone invalide.');
  if (!mot_de_passe || mot_de_passe.length < 6) erreurs.push('Le mot de passe doit contenir au moins 6 caractères.');
  if (!fonction_id) erreurs.push('fonction_id est requis.');
  if (!canton_id) erreurs.push('canton_id est requis.');

  if (erreurs.length > 0) {
    return res.status(400).json({ erreurs });
  }
  next();
}

// CORRECTION : accepte maintenant en plus nom/prenom/sexe/telephone/email
// en modification (tous optionnels — seuls fonction_id et canton_id
// restent obligatoires, comme avant). Si fournis, ils sont validés au
// même format qu'à la création.
function validerModification(req, res, next) {
  const { nom, prenom, sexe, telephone, fonction_id, canton_id } = req.body;
  const erreurs = [];

  if (!fonction_id) erreurs.push('fonction_id est requis.');
  if (!canton_id) erreurs.push('canton_id est requis.');

  if (nom !== undefined && nom.trim().length < 2) erreurs.push('Le nom doit contenir au moins 2 caractères.');
  if (prenom !== undefined && prenom.trim().length < 2) erreurs.push('Le prénom doit contenir au moins 2 caractères.');
  if (sexe !== undefined && !['M', 'F'].includes(sexe)) erreurs.push("Le sexe doit être 'M' ou 'F'.");
  if (telephone !== undefined && !/^\+?[0-9]{8,15}$/.test(telephone)) erreurs.push('Numéro de téléphone invalide.');

  if (erreurs.length > 0) {
    return res.status(400).json({ erreurs });
  }
  next();
}

module.exports = { validerCreation, validerModification };
