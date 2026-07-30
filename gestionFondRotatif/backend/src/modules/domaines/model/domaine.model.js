/**
 * Modèle Domaine — représentation de l'entité métier.
 *
 * Un domaine est un secteur d'activité (Agriculture, Élevage...) auquel une
 * DemandeFinancement est rattachée (voir modules/demandes_financement).
 * Donnée de référence simple, sans logique de calcul propre.
 */
class Domaine {
  /**
   * @param {Object} row - ligne brute issue du repository (colonnes SQL)
   */
  constructor(row) {
    this.id = row.id;
    this.nom = row.nom;
    this.description = row.description;
    this.actif = !!row.actif;
  }

  /**
   * Construit une instance Domaine à partir d'une ligne SQL, ou null.
   * @param {Object|null} row
   * @returns {Domaine|null}
   */
  static fromRow(row) {
    if (!row) return null;
    return new Domaine(row);
  }
}

module.exports = Domaine;
