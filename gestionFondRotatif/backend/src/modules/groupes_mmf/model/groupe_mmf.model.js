/**
 * Modèle GroupeMMF — un groupe de solidarité MMF, rattaché à un canton.
 * responsableBeneficiaireId pointe vers un bénéficiaire élu PARMI les
 * membres du groupe (vérifié applicativement, voir groupe_mmf.service.js).
 */
class GroupeMMF {
  constructor(row) {
    this.id = row.id;
    this.nom = row.nom;
    this.cantonId = row.canton_id;
    this.cantonNom = row.canton_nom;
    this.responsableBeneficiaireId = row.responsable_beneficiaire_id;
    this.responsableNom = row.responsable_nom;
    this.responsablePrenom = row.responsable_prenom;
    this.dateCreation = row.date_creation;
    this.actif = !!row.actif;
    this.nombreMembres = row.nombre_membres !== undefined ? Number(row.nombre_membres) : undefined;
  }

  static fromRow(row) {
    if (!row) return null;
    return new GroupeMMF(row);
  }
}

/** Une ligne d'adhésion : un bénéficiaire dans un groupe, avec sa date d'entrée. */
class AdhesionGroupe {
  constructor(row) {
    this.id = row.id;
    this.groupeMmfId = row.groupe_mmf_id;
    this.beneficiaireId = row.beneficiaire_id;
    this.beneficiaireNom = row.beneficiaire_nom;
    this.beneficiairePrenom = row.beneficiaire_prenom;
    this.dateAdhesion = row.date_adhesion;
    this.actif = !!row.actif;
  }

  static fromRow(row) {
    if (!row) return null;
    return new AdhesionGroupe(row);
  }
}

module.exports = { GroupeMMF, AdhesionGroupe };
