const jwt = require('jsonwebtoken');

function verifierToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token manquant.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.utilisateurId = payload.id;
    next();
  } catch (erreur) {
    return res.status(401).json({ message: 'Token invalide ou expiré.' });
  }
}

module.exports = { verifierToken };
