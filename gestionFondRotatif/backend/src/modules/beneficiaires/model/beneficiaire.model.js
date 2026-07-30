/**
 * Modèle Beneficiaire — combine les champs hérités de Utilisateur
 * et les champs propres à Beneficiaire (age_estime, activite, statut_mmf...).
 */
class Beneficiaire {
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
    this.ageEstime = row.age_estime;
    this.activite = row.activite;
    this.latitude = row.latitude;
    this.longitude = row.longitude;
    this.statutMMF = row.statut_mmf;
    this.dateCreation = row.date_creation;
    this.actif = !!row.actif;
  }

  static fromRow(row) {
    if (!row) return null;
    return new Beneficiaire(row);
  }
}

module.exports = Beneficiaire;
