const db = require('../../../config/db');

/**
 * Repository Vague — accès direct à la table `vague`.
 *
 * Une vague représente une campagne de financement (une période pendant
 * laquelle plusieurs comités peuvent soumettre des demandes). Confirmé par
 * le président : une vague est un événement global (national/régional)
 * auquel plusieurs comités participent, d'où la cardinalité
 * DemandeFinancement 0..* -- 1 Vague.
 */

/** Retourne toutes les vagues, les plus récentes en premier. */
async function findAll() {
  const [rows] = await db.query('SELECT * FROM vague ORDER BY date_debut DESC');
  return rows;
}

/** Retourne une vague par son id, ou null. */
async function findById(id) {
  const [rows] = await db.query('SELECT * FROM vague WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

/**
 * Génère un code de vague lisible, format VG-ANNEE-NoOrdre (ex: VG-2026-01).
 * @param {number} annee
 * @param {number} numeroOrdre
 * @returns {string}
 */
function genererCodeVague(annee, numeroOrdre) {
  return `VG-${annee}-${String(numeroOrdre).padStart(2, '0')}`;
}

/** Compte les vagues déjà créées pour une année donnée (pour le numéro d'ordre du code). */
async function compterVaguesAnnee(annee) {
  const [rows] = await db.query('SELECT COUNT(*) AS total FROM vague WHERE YEAR(date_debut) = ?', [annee]);
  return rows[0].total;
}

/**
 * Crée une nouvelle vague, avec un code généré automatiquement et un
 * statut initial "Planifiee".
 * @param {{nom: string, description?: string, date_debut: string, date_fin: string, budget_prevu?: number}} data
 * @returns {Promise<Object>} la vague créée
 */
async function create({ nom, description, date_debut, date_fin, budget_prevu }) {
  const annee = new Date(date_debut).getFullYear();
  const nb = await compterVaguesAnnee(annee);
  const codeVague = genererCodeVague(annee, nb + 1);

  const [result] = await db.query(
    `INSERT INTO vague (code_vague, nom, description, date_debut, date_fin, budget_prevu, statut, date_creation)
     VALUES (?, ?, ?, ?, ?, ?, 'Planifiee', NOW())`,
    [codeVague, nom, description || null, date_debut, date_fin, budget_prevu || null]
  );
  return findById(result.insertId);
}

/**
 * Change le statut d'une vague (ex: "EnCours" au démarrage, "Cloturee" à la fin).
 * @param {number} id
 * @param {string} statut
 */
async function majStatut(id, statut) {
  await db.query('UPDATE vague SET statut = ? WHERE id = ?', [statut, id]);
  return findById(id);
}

module.exports = { findAll, findById, create, majStatut };
