const db = require('../../../config/db');

async function findByTelephone(telephone) {
  const [rows] = await db.query('SELECT * FROM utilisateur WHERE telephone = ? LIMIT 1', [telephone]);
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await db.query('SELECT * FROM utilisateur WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function create({ code_utilisateur, nom, prenom, sexe, telephone, email, mot_de_passe, photo }) {
  const [result] = await db.query(
    `INSERT INTO utilisateur
      (code_utilisateur, nom, prenom, sexe, telephone, email, mot_de_passe, photo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [code_utilisateur, nom, prenom, sexe, telephone, email || null, mot_de_passe, photo || null]
  );
  return findById(result.insertId);
}

async function update(id, { nom, prenom, sexe, telephone, email }) {
  await db.query(
    `UPDATE utilisateur SET nom = ?, prenom = ?, sexe = ?, telephone = ?, email = ? WHERE id = ?`,
    [nom, prenom, sexe, telephone, email || null, id]
  );
  return findById(id);
}

// AJOUT : suppression d'un utilisateur — appelée via une connexion de
// transaction, après suppression de la ligne fille (beneficiaire,
// membre_comite, autorite...) qui la référence.
async function supprimer(executeur, id) {
  await executeur.query('DELETE FROM utilisateur WHERE id = ?', [id]);
}

module.exports = { findByTelephone, findById, create, update, supprimer };
