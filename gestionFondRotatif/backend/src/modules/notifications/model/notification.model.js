/**
 * Modèle Notification — une alerte générée automatiquement par
 * l'application pour un utilisateur (jamais saisie manuellement).
 */
class Notification {
  constructor(row) {
    this.id = row.id;
    this.titre = row.titre;
    this.message = row.message;
    this.lue = !!row.lue;
    this.dateCreation = row.date_creation;
  }

  static fromRow(row) {
    if (!row) return null;
    return new Notification(row);
  }
}

module.exports = Notification;
