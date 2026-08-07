class Parametre {
  constructor(row) {
    this.id = row.id;
    this.cle = row.cle;
    this.valeur = row.valeur;
    this.description = row.description;
  }

  static fromRow(row) {
    if (!row) return null;
    return new Parametre(row);
  }
}

module.exports = Parametre;
