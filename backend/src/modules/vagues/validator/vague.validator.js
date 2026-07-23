/**
 * Valide les données d'entrée pour la création d'une vague.
 * Vérifie notamment la cohérence des dates (fin après début), pour éviter
 * des campagnes mal formées dès la saisie plutôt qu'en base.
 */
function validerCreation(req, res, next) {
  const { nom, date_debut, date_fin } = req.body;
  const erreurs = [];

  if (!nom || nom.trim().length < 2) erreurs.push('Le nom de la vague est requis.');
  if (!date_debut) erreurs.push('date_debut est requise.');
  if (!date_fin) erreurs.push('date_fin est requise.');
  if (date_debut && date_fin && new Date(date_fin) <= new Date(date_debut)) {
    erreurs.push('date_fin doit être postérieure à date_debut.');
  }

  if (erreurs.length > 0) return res.status(400).json({ erreurs });
  next();
}

module.exports = { validerCreation };
