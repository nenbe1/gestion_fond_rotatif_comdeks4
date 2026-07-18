const authentificationService = require('../service/authentification.service');

async function inscrire(req, res) {
  try {
    const utilisateur = await authentificationService.inscrire(req.body);
    res.status(201).json({ utilisateur });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function connecter(req, res) {
  try {
    const { token, utilisateur } = await authentificationService.connecter(req.body);
    res.status(200).json({ token, utilisateur });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

module.exports = { inscrire, connecter };
