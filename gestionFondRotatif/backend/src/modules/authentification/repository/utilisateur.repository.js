const db = require('../../../config/db');

/**
 * Modèle Utilisateur — accès direct à la table `utilisateur`.
 * Pas d'ORM : requêtes SQL explicites via mysql2/promise.
 */

async function findByTelephone(telephone) {
  const [rows] = await db.query(
    'SELECT * FROM utilisateur WHERE telephone = ? LIMIT 1',
    [telephone]
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await db.query(
    'SELECT * FROM utilisateur WHERE id = ? LIMIT 1',
    [id]
  );
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

// AJOUT : mise à jour des infos de base d'un utilisateur (nom, prénom,
// téléphone, email) — utilisé par les modules qui héritent d'Utilisateur
// (membre_comite, autorite, etc.) pour corriger une faute de saisie sans
// devoir recréer le compte.
async function update(id, { nom, prenom, sexe, telephone, email }) {
  await db.query(
    `UPDATE utilisateur SET nom = ?, prenom = ?, sexe = ?, telephone = ?, email = ? WHERE id = ?`,
    [nom, prenom, sexe, telephone, email || null, id]
  );
  return findById(id);
}

module.exports = { findByTelephone, findById, create, update };
