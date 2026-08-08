/**
 * Modèle ConseillerIAEchange — un échange question/réponse entre un
 * bénéficiaire et le Conseiller Financier IA, conservé pour historique.
 */
class ConseillerIAEchange {
  constructor(row) {
    this.id = row.id;
    this.beneficiaireId = row.beneficiaire_id;
    this.question = row.question;
    this.reponse = row.reponse;
    this.dateCreation = row.date_creation;
  }

  static fromRow(row) {
    if (!row) return null;
    return new ConseillerIAEchange(row);
  }
}

module.exports = ConseillerIAEchange;
