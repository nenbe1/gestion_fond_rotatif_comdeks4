/**
 * Modèle Utilisateur — représentation de l'entité métier.
 * L'accès aux données (SQL) est délégué au repository, pas ici.
 */
class Utilisateur {
  constructor({ id, code_utilisateur, nom, prenom, sexe, telephone, email, photo, date_creation, actif }) {
    this.id = id;
    this.codeUtilisateur = code_utilisateur;
    this.nom = nom;
    this.prenom = prenom;
    this.sexe = sexe;
    this.telephone = telephone;
    this.email = email;
    this.photo = photo;
    this.dateCreation = date_creation;
    this.actif = !!actif;
  }

  /** Ne jamais exposer mot_de_passe dans les réponses API. */
  static fromRow(row) {
    if (!row) return null;
    return new Utilisateur(row);
  }
}

module.exports = Utilisateur;
