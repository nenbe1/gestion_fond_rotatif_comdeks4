class Canton {
  constructor(row) {
    this.id = row.id;
    this.nom = row.nom;
    this.latitude = row.latitude;
    this.longitude = row.longitude;
    this.actif = !!row.actif;
  }

  static fromRow(row) {
    if (!row) return null;
    return new Canton(row);
  }
}

module.exports = Canton;
