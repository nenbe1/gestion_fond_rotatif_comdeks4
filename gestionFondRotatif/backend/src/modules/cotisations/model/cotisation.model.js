/**
 * Modèle Cotisation — un versement individuel d'un bénéficiaire dans un
 * groupe MMF, sans périodicité imposée.
 */
class Cotisation {
  constructor(row) {
    this.id = row.id;
    this.codeCotisation = row.code_cotisation;
    this.groupeMmfId = row.groupe_mmf_id;
    this.groupeNom = row.groupe_nom;
    this.beneficiaireId = row.beneficiaire_id;
    this.beneficiaireNom = row.beneficiaire_nom;
    this.beneficiairePrenom = row.beneficiaire_prenom;
    this.montant = row.montant;
    this.dateVersement = row.date_versement;
    this.observation = row.observation;
    this.enregistrePar = row.enregistre_par;
    this.enregistreParNom = row.enregistre_par_nom;
    this.enregistreParPrenom = row.enregistre_par_prenom;
  }

  static fromRow(row) {
    if (!row) return null;
    return new Cotisation(row);
  }
}

module.exports = Cotisation;
