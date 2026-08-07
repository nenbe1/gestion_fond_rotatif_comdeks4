class AttributionFinancement {
  constructor(row) {
    this.id = row.id;
    this.financementId = row.financement_id;
    this.codeFinancement = row.code_financement;
    this.beneficiaireId = row.beneficiaire_id;
    this.beneficiaireNom = row.beneficiaire_nom;
    this.beneficiairePrenom = row.beneficiaire_prenom;
    this.montantAttribue = row.montant_attribue;
    // AJOUT : taux figé au moment du décaissement du financement (voir
    // financement.service.creerDepuisDemande) — nécessaire pour calculer
    // le "reste à payer" en tenant compte de la majoration (voir
    // attribution.service.calculerResteAPayer).
    this.tauxMajorationApplique = row.taux_majoration_applique;
    this.dateAttribution = row.date_attribution;
  }

  static fromRow(row) {
    if (!row) return null;
    return new AttributionFinancement(row);
  }
}

module.exports = AttributionFinancement;
