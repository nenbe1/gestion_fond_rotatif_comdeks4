function validerQuestion(req, res, next) {
  const { question } = req.body;
  const erreurs = [];

  if (!question || typeof question !== 'string' || question.trim().length < 3) {
    erreurs.push('La question est requise (3 caractères minimum).');
  }
  if (question && question.length > 1000) {
    erreurs.push('La question est trop longue (1000 caractères maximum).');
  }

  if (erreurs.length > 0) {
    return res.status(400).json({ erreurs });
  }
  next();
}

module.exports = { validerQuestion };
