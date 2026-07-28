/**
 * Modèle Autorite — combine les champs hérités de Utilisateur et les
 * champs propres à Autorite (fonction, critère de statistiques).
 * Un délégué (Jeunesse, Femmes, Agriculture...) n'a jamais qu'un seul
 * critère à la fois : soit un domaine, soit un sexe, soit un âge max.
 */
class Autorite {
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
    this.fonction = row.fonction;
    this.typeCritere = row.type_critere; // 'DOMAINE' | 'SEXE' | 'AGE_MAX'
    this.domaineId = row.domaine_id;
    this.domaineNom = row.domaine_nom; // présent seulement si type_critere = DOMAINE (jointure)
    this.valeurCritere = row.valeur_critere;
    this.dateCreation = row.date_creation;
    this.actif = !!row.actif;
  }

  static fromRow(row) {
    if (!row) return null;
    return new Autorite(row);
  }
}

module.exports = Autorite;
