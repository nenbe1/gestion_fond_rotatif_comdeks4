function validerCreation(req, res, next) {
  const {
    vague_id, domaine_id, objet_demande,
    nb_femmes_benef, nb_hommes_benef, montant_demande,
    beneficiaires_prevus,
  } = req.body;
  const erreurs = [];

  if (!vague_id) erreurs.push('vague_id est requis.');
  if (!domaine_id) erreurs.push('domaine_id est requis.');
  if (!objet_demande || objet_demande.trim().length < 5) erreurs.push("L'objet de la demande est requis (5 caractères minimum).");
  if (montant_demande === undefined || Number(montant_demande) <= 0) erreurs.push('Le montant demandé doit être positif.');
  if (nb_femmes_benef !== undefined && Number(nb_femmes_benef) < 0) erreurs.push('nb_femmes_benef ne peut pas être négatif.');
  if (nb_hommes_benef !== undefined && Number(nb_hommes_benef) < 0) erreurs.push('nb_hommes_benef ne peut pas être négatif.');
  if ((Number(nb_femmes_benef) || 0) + (Number(nb_hommes_benef) || 0) === 0) {
    erreurs.push('Au moins un bénéficiaire (femme ou homme) doit être renseigné.');
  }

  if (beneficiaires_prevus !== undefined) {
    if (!Array.isArray(beneficiaires_prevus)) {
      erreurs.push('beneficiaires_prevus doit être une liste.');
    } else {
      beneficiaires_prevus.forEach((item, index) => {
        const aId = !!item.beneficiaire_id;
        const aNomLibre = !!(item.nom_libre && item.nom_libre.trim());
        if (aId === aNomLibre) { // ni l'un ni l'autre, ou les deux à la fois
          erreurs.push(`beneficiaires_prevus[${index}] doit avoir soit beneficiaire_id, soit nom_libre (un seul des deux).`);
        }
      });
    }
  }

  if (erreurs.length > 0) {
    return res.status(400).json({ erreurs });
  }
  next();
}

module.exports = { validerCreation };
