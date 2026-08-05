/**
 * Modèle Parametre — donnée de configuration clé/valeur.
 * Consultée par les autres modules (ex: financements lit
 * "taux_majoration_remboursement" au moment de créer un Financement).
 */
class Parametre {
  /** @param {Object} row - ligne brute issue du repository */
  constructor(row) {
    this.id = row.id;
    this.cle = row.cle;
    this.valeur = row.valeur;
    this.description = row.description;
  }

  /**
   * @param {Object|null} row
   * @returns {Parametre|null}
   */
  static fromRow(row) {
    if (!row) return null;
    return new Parametre(row);
  }
}

module.exports = Parametre;
