class MembreComite {
  constructor(row) {
    this.id = row.id;
    this.utilisateurId = row.utilisateur_id;
    this.codeUtilisateur = row.code_utilisateur;
    this.nom = row.nom;
    this.prenom = row.prenom;
    this.sexe = row.sexe;
    this.telephone = row.telephone;
    this.email = row.email;
    this.photo = row.photo;
    this.fonctionId = row.fonction_id;
    this.fonctionCode = row.fonction_code;
    this.fonctionLibelle = row.fonction_libelle;
    this.cantonId = row.canton_id;
    this.cantonNom = row.canton_nom;
    this.dateIntegration = row.date_integration;
    this.actif = !!row.actif;
  }

  static fromRow(row) {
    if (!row) return null;
    return new MembreComite(row);
  }
}

module.exports = MembreComite;
