/**
 * Modèle Vague — représentation de l'entité métier.
 *
 * Cycle de vie : Planifiee -> EnCours -> Cloturee (voir service.demarrer/cloturer).
 */
class Vague {
  /** @param {Object} row - ligne brute issue du repository */
  constructor(row) {
    this.id = row.id;
    this.codeVague = row.code_vague;
    this.nom = row.nom;
    this.description = row.description;
    this.dateDebut = row.date_debut;
    this.dateFin = row.date_fin;
    this.budgetPrevu = row.budget_prevu;
    this.statut = row.statut;
    this.dateCreation = row.date_creation;
  }

  /**
   * @param {Object|null} row
   * @returns {Vague|null}
   */
  static fromRow(row) {
    if (!row) return null;
    return new Vague(row);
  }
}

module.exports = Vague;
