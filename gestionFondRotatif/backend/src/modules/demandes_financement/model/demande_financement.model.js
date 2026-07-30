class DemandeFinancement {
  constructor(row) {
    this.id = row.id;
    this.codeDemande = row.code_demande;
    this.membreComiteId = row.membre_comite_id;
    this.vagueId = row.vague_id;
    this.vagueNom = row.vague_nom;
    this.domaineId = row.domaine_id;
    this.domaineNom = row.domaine_nom;
    this.objetDemande = row.objet_demande;
    this.resultatAttendu = row.resultat_attendu;
    this.periodePrevisionnelle = row.periode_previsionnelle;
    this.siteTravail = row.site_travail;
    this.nbFemmesBenef = row.nb_femmes_benef;
    this.nbHommesBenef = row.nb_hommes_benef;
    this.montantDemande = row.montant_demande;
    this.coFinancementEnNature = row.co_financement_en_nature;
    this.coFinancementEspeces = row.co_financement_especes;
    this.statutGlobal = row.statut_global;
    this.dateCreation = row.date_creation;
  }

  static fromRow(row) {
    if (!row) return null;
    return new DemandeFinancement(row);
  }
}

module.exports = DemandeFinancement;
