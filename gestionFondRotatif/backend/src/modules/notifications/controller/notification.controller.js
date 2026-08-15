const notificationService = require('../service/notification.service');

async function consulterMoi(req, res) {
  try {
    const notifications = await notificationService.consulterMesNotifications(req.utilisateurId);
    res.status(200).json({ notifications });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function compterNonLues(req, res) {
  try {
    const total = await notificationService.compterNonLues(req.utilisateurId);
    res.status(200).json({ total });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function marquerLue(req, res) {
  try {
    await notificationService.marquerLue(req.params.id, req.utilisateurId);
    res.status(200).json({ message: 'Notification marquée comme lue.' });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

async function marquerToutesLues(req, res) {
  try {
    await notificationService.marquerToutesLues(req.utilisateurId);
    res.status(200).json({ message: 'Toutes les notifications ont été marquées comme lues.' });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

module.exports = { consulterMoi, compterNonLues, marquerLue, marquerToutesLues };
