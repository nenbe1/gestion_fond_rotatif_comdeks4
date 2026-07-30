/**
 * Modèle RapportGenere — instantané figé des indicateurs à une date donnée.
 * Ne représente jamais un état "en direct" (voir repository pour le détail
 * de la philosophie de conception).
 */
class RapportGenere {
  /** @param {Object} row - ligne brute issue du repository */
  constructor(row) {
    this.id = row.id;
    this.dateGeneration = row.date_generation;
    this.periodeDebut = row.periode_debut;
    this.periodeFin = row.periode_fin;
    this.nombreBeneficiaires = row.nombre_beneficiaires;
    this.montantTotalFinance = row.montant_total_finance;
    this.montantTotalRembourse = row.montant_total_rembourse;
    this.tauxRemboursement = row.taux_remboursement;
    this.nombreRetards = row.nombre_retards;
    this.generePar = row.genere_par;
  }

  /**
   * @param {Object|null} row
   * @returns {RapportGenere|null}
   */
  static fromRow(row) {
    if (!row) return null;
    return new RapportGenere(row);
  }
}

module.exports = RapportGenere;
