/**
 * Modèle FondRotatif — représentation de l'entité métier.
 *
 * `montantFond` est le solde actuellement disponible, débité par
 * Financement et crédité par RemboursementCollectif (voir ces modules).
 */
class FondRotatif {
  /** @param {Object} row - ligne brute issue du repository */
  constructor(row) {
    this.id = row.id;
    this.codeFond = row.code_fond;
    this.libelleFond = row.libelle_fond;
    this.montantFond = row.montant_fond;
  }

  /**
   * @param {Object|null} row
   * @returns {FondRotatif|null}
   */
  static fromRow(row) {
    if (!row) return null;
    return new FondRotatif(row);
  }
}

module.exports = FondRotatif;
