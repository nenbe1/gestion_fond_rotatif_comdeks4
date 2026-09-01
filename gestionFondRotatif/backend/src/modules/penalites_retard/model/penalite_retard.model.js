class PenaliteRetard {
  constructor(row) {
    this.id = row.id;
    this.attributionFinancementId = row.attribution_financement_id;
    this.semainesRetard = row.semaines_retard;
    this.montantRestantDu = row.montant_restant_du;
    this.montantPropose = row.montant_propose;
    this.statut = row.statut;
    this.dateCalcul = row.date_calcul;
    this.dateDecision = row.date_decision;
    this.responsableId = row.responsable_id;

    // Champs de confort ajoutés par la jointure du repository, pour que
    // la Responsable sache immédiatement de qui/quel financement il
    // s'agit sans requête supplémentaire côté frontend.
    this.codeFinancement = row.code_financement;
    this.beneficiaireNom = row.beneficiaire_nom;
    this.beneficiairePrenom = row.beneficiaire_prenom;
  }
  static fromRow(row) {
    if (!row) return null;
    return new PenaliteRetard(row);
  }
}

module.exports = PenaliteRetard;
