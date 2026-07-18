function validerTraitement(req, res, next) {
  const { decision } = req.body;
  const erreurs = [];

  if (!decision || !['Approuve', 'Rejete'].includes(decision)) {
    erreurs.push("Le champ 'decision' doit valoir 'Approuve' ou 'Rejete'.");
  }

  if (erreurs.length > 0) {
    return res.status(400).json({ erreurs });
  }
  next();
}

module.exports = { validerTraitement };
