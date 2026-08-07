class Fonction {
  constructor(row, habilitations = []) {
    this.id = row.id;
    this.code = row.code;
    this.libelle = row.libelle;
    this.habilitations = habilitations;
  }

  static fromRow(row, habilitations = []) {
    if (!row) return null;
    return new Fonction(row, habilitations);
  }
}

module.exports = Fonction;
