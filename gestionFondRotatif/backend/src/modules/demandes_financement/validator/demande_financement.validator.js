function validerCreation(req, res, next) {
  const {
    membre_comite_id, vague_id, domaine_id, objet_demande,
    nb_femmes_benef, nb_hommes_benef, montant_demande,
  } = req.body;
  const erreurs = [];

  if (!membre_comite_id) erreurs.push('membre_comite_id est requis.');
  if (!vague_id) erreurs.push('vague_id est requis.');
  if (!domaine_id) erreurs.push('domaine_id est requis.');
  if (!objet_demande || objet_demande.trim().length < 5) erreurs.push("L'objet de la demande est requis (5 caractères minimum).");
  if (montant_demande === undefined || Number(montant_demande) <= 0) erreurs.push('Le montant demandé doit être positif.');
  if (nb_femmes_benef !== undefined && Number(nb_femmes_benef) < 0) erreurs.push('nb_femmes_benef ne peut pas être négatif.');
  if (nb_hommes_benef !== undefined && Number(nb_hommes_benef) < 0) erreurs.push('nb_hommes_benef ne peut pas être négatif.');
  if ((Number(nb_femmes_benef) || 0) + (Number(nb_hommes_benef) || 0) === 0) {
    erreurs.push('Au moins un bénéficiaire (femme ou homme) doit être renseigné.');
  }

  if (erreurs.length > 0) {
    return res.status(400).json({ erreurs });
  }
  next();
}

module.exports = { validerCreation };
