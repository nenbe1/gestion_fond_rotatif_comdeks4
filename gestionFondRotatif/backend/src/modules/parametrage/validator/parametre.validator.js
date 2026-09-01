/**
 * Liste des clés réellement exploitées ailleurs dans le code — une clé
 * hors de cette liste ne servirait à rien (aucun module ne la lit),
 * donc on empêche d'en créer une par erreur de frappe ou par confusion.
 * Pour ajouter un nouveau réglage réellement utilisé, ajouter sa clé
 * ici en même temps que le code qui la consomme.
 */
const CLES_CONNUES = ['taux_majoration_remboursement', 'taux_penalite_retard'];

/** Valide les données d'entrée pour la création d'un paramètre. */
function validerCreation(req, res, next) {
  const { cle, valeur } = req.body;
  const erreurs = [];
  if (!cle || cle.trim().length < 2) erreurs.push('La clé du paramètre est requise.');
  else if (!CLES_CONNUES.includes(cle.trim())) {
    erreurs.push(`Clé inconnue : "${cle}". Seules ces clés sont exploitées par l'application : ${CLES_CONNUES.join(', ')}.`);
  }
  if (valeur === undefined || valeur === null || valeur === '') erreurs.push('La valeur du paramètre est requise.');
  if (erreurs.length > 0) return res.status(400).json({ erreurs });
  next();
}

/** Valide la nouvelle valeur fournie pour la modification d'un paramètre. */
function validerModification(req, res, next) {
  const { valeur } = req.body;
  if (valeur === undefined || valeur === null || valeur === '') {
    return res.status(400).json({ erreurs: ['La nouvelle valeur est requise.'] });
  }
  next();
}

module.exports = { validerCreation, validerModification, CLES_CONNUES };
