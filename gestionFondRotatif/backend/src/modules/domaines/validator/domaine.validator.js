/**
 * Valide les données d'entrée pour la création d'un domaine.
 * Middleware Express : appelle next() si valide, sinon répond 400
 * directement sans atteindre le controller.
 */
function validerCreation(req, res, next) {
  const { nom } = req.body;
  if (!nom || nom.trim().length < 2) {
    return res.status(400).json({ erreurs: ['Le nom du domaine est requis (2 caractères minimum).'] });
  }
  next();
}

module.exports = { validerCreation };
