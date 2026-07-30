class Financement {
  constructor(row) {
    this.id = row.id;
    this.codeFinancement = row.code_financement;
    this.referenceUtilisateur = row.reference_utilisateur;
    this.demandeFinancementId = row.demande_financement_id;
    this.codeDemande = row.code_demande;
    this.fondRotatifId = row.fond_rotatif_id;
    this.fondLibelle = row.fond_libelle;
    this.programmeId = row.programme_id;
    this.programmeNom = row.programme_nom;
    this.responsableId = row.responsable_id;
    this.montantFinancement = row.montant_financement;
    this.tauxMajorationApplique = row.taux_majoration_applique;
    this.dateDecaissement = row.date_decaissement;
    this.statut = row.statut;
  }

  static fromRow(row) {
    if (!row) return null;
    return new Financement(row);
  }
}

module.exports = Financement;
