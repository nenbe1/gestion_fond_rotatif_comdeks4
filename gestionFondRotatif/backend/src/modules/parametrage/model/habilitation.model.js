class Habilitation {
  constructor(row) {
    this.id = row.id;
    this.code = row.code;
    this.libelle = row.libelle;
  }

  static fromRow(row) {
    if (!row) return null;
    return new Habilitation(row);
  }
}

module.exports = Habilitation;
