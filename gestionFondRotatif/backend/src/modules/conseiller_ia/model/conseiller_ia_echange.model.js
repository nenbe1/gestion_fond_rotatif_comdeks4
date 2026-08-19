/**
 * Modèle ConseillerIAEchange — un échange question/réponse avec le
 * Conseiller Financier IA, conservé pour historique. Porte soit sur un
 * bénéficiaire (Mobile), soit sur un canton (Web, Responsable) — jamais
 * les deux (voir contrainte chk_conseiller_ia_cible en base).
 */
class ConseillerIAEchange {
  constructor(row) {
    this.id = row.id;
    this.beneficiaireId = row.beneficiaire_id;
    this.cantonId = row.canton_id;
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
