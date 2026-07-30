const TYPES_CRITERE = ['DOMAINE', 'SEXE', 'AGE_MAX'];

function validerCreation(req, res, next) {
  const {
    nom, prenom, sexe, telephone, mot_de_passe,
    fonction, type_critere, domaine_id, valeur_critere,
  } = req.body;
  const erreurs = [];

  if (!nom || nom.trim().length < 2) erreurs.push('Le nom est requis (2 caractères minimum).');
  if (!prenom || prenom.trim().length < 2) erreurs.push('Le prénom est requis (2 caractères minimum).');
  if (!sexe || !['M', 'F'].includes(sexe)) erreurs.push("Le sexe doit être 'M' ou 'F'.");
  if (!telephone || !/^\+?[0-9]{8,15}$/.test(telephone)) erreurs.push('Numéro de téléphone invalide.');
  if (!mot_de_passe || mot_de_passe.length < 6) erreurs.push('Le mot de passe doit contenir au moins 6 caractères.');
  if (!fonction || fonction.trim().length < 3) erreurs.push('La fonction du délégué est requise (ex. "Délégué de la Jeunesse").');

  if (!type_critere || !TYPES_CRITERE.includes(type_critere)) {
    erreurs.push(`type_critere doit être l'un de : ${TYPES_CRITERE.join(', ')}.`);
  } else if (type_critere === 'DOMAINE') {
    if (!domaine_id) erreurs.push('domaine_id est requis quand type_critere = DOMAINE.');
    if (valeur_critere) erreurs.push('valeur_critere ne doit pas être renseigné quand type_critere = DOMAINE.');
  } else if (type_critere === 'SEXE') {
    if (!valeur_critere || !['M', 'F'].includes(valeur_critere)) {
      erreurs.push("valeur_critere doit être 'M' ou 'F' quand type_critere = SEXE.");
    }
    if (domaine_id) erreurs.push('domaine_id ne doit pas être renseigné quand type_critere = SEXE.');
  } else if (type_critere === 'AGE_MAX') {
    if (!valeur_critere || Number.isNaN(Number(valeur_critere)) || Number(valeur_critere) <= 0) {
      erreurs.push('valeur_critere doit être un âge maximum valide (nombre positif) quand type_critere = AGE_MAX.');
    }
    if (domaine_id) erreurs.push('domaine_id ne doit pas être renseigné quand type_critere = AGE_MAX.');
  }

  if (erreurs.length > 0) {
    return res.status(400).json({ erreurs });
  }
  next();
}

module.exports = { validerCreation };
