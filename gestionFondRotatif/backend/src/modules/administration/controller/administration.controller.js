const administrationService = require('../service/administration.service');

/** GET /api/administration/utilisateurs — vue unifiée de tous les comptes. */
async function consulterUtilisateurs(req, res) {
  try {
    const utilisateurs = await administrationService.consulterTousLesUtilisateurs(req.utilisateurId);
    res.status(200).json({ utilisateurs });
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

/** GET /api/administration/sauvegarde — télécharge un export SQL des données actuelles. */
async function telechargerSauvegarde(req, res) {
  try {
    const sql = await administrationService.genererSauvegarde(req.utilisateurId);
    const horodatage = new Date().toISOString().replace(/[:.]/g, '-');
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="sauvegarde_${horodatage}.sql"`);
    res.status(200).send(sql);
  } catch (erreur) {
    res.status(erreur.statusCode || 500).json({ message: erreur.message });
  }
}

module.exports = { consulterUtilisateurs, telechargerSauvegarde };
