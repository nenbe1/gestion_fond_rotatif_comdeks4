/**
 * Modèle Programme — représentation de l'entité métier.
 *
 * Rattaché à Financement (voir modules/financements) : chaque décaissement
 * précise de quel programme/bailleur provient l'argent utilisé.
 */
class Programme {
  /** @param {Object} row - ligne brute issue du repository */
  constructor(row) {
    this.id = row.id;
    this.nom = row.nom;
    this.description = row.description;
    this.actif = !!row.actif;
  }

  /**
   * @param {Object|null} row
   * @returns {Programme|null}
   */
  static fromRow(row) {
    if (!row) return null;
    return new Programme(row);
  }
}

module.exports = Programme;
