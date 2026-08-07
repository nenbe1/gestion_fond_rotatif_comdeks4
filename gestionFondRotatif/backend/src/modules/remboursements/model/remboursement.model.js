class RemboursementBeneficiaire {
  constructor(row) {
    this.id = row.id;
    this.attributionFinancementId = row.attribution_financement_id;
    this.montant = row.montant;
    this.dateVersement = row.date_versement;
    this.observation = row.observation;
    // AJOUT : double validation — 'EnAttente' quand le Trésorier vient
    // de l'enregistrer, 'Confirme' seulement une fois qu'il confirme
    // avoir vérifié la somme reçue. Seul un remboursement Confirme
    // compte dans la situation du bénéficiaire (voir attribution.repository).
    this.statut = row.statut;
  }
  static fromRow(row) {
    if (!row) return null;
    return new RemboursementBeneficiaire(row);
  }
}

class RemboursementCollectif {
  constructor(row) {
    this.id = row.id;
    this.financementId = row.financement_id;
    this.codeFinancement = row.code_financement;
    this.numeroSemaine = row.numero_semaine;
    this.datePrevue = row.date_prevue;
    this.datePaiement = row.date_paiement;
    this.montantPrevu = row.montant_prevu;
    this.montantVerse = row.montant_verse;
    this.statut = row.statut;
    this.observation = row.observation;
  }
  static fromRow(row) {
    if (!row) return null;
    return new RemboursementCollectif(row);
  }
}

module.exports = { RemboursementBeneficiaire, RemboursementCollectif };
