const db = require('../../../config/db');

/**
 * Repository Administration — module transversal (pas de nouvelle table
 * "utilisateur unifié" : on interroge chaque table de rôle et on fusionne
 * en JS, voir le service). Sert aussi à générer une sauvegarde manuelle
 * de la base (export SQL complet, sans dépendre d'un outil externe type
 * mysqldump — voir genererDumpSQL).
 */

async function findAllResponsables() {
  const [rows] = await db.query(`
    SELECT
      r.id, r.utilisateur_id, r.date_nomination, r.actif,
      u.code_utilisateur, u.nom, u.prenom, u.sexe, u.telephone, u.email
    FROM responsable_fond_rotatif r
    INNER JOIN utilisateur u ON u.id = r.utilisateur_id
    ORDER BY u.nom ASC
  `);
  return rows;
}

// Ordre important : tables "parentes" avant leurs tables "enfants", pour
// que la sauvegarde reste lisible même si on décidait un jour de la
// rejouer avec FOREIGN_KEY_CHECKS actif. Avec FOREIGN_KEY_CHECKS=0
// (voir genererDumpSQL), l'ordre n'est plus obligatoire, mais autant
// garder un fichier propre et logique à relire.
const TABLES_SAUVEGARDE = [
  'utilisateur', 'canton', 'fonction', 'habilitation', 'fonction_habilitation',
  'parametre', 'domaine', 'vague', 'fond_rotatif', 'programme',
  'beneficiaire', 'membre_comite', 'responsable_fond_rotatif', 'autorite',
  'demande_financement', 'demande_beneficiaire_prevu', 'financement',
  'attribution_financement', 'remboursement_beneficiaire', 'remboursement_collectif',
  'validation', 'rapport_genere',
];

/**
 * Génère un dump SQL complet (structure déjà connue via schema_mmf.sql,
 * ceci exporte uniquement les DONNÉES) : pour chaque table, un
 * TRUNCATE puis les INSERT correspondant à chaque ligne actuelle.
 * FOREIGN_KEY_CHECKS est désactivé pendant l'opération pour ne pas être
 * bloqué par l'ordre des tables au moment de la restauration.
 */
async function genererDumpSQL() {
  const lignesSQL = [];
  lignesSQL.push(`-- Sauvegarde manuelle - gestion_fond_rotatif - ${new Date().toISOString()}`);
  lignesSQL.push('SET FOREIGN_KEY_CHECKS=0;');
  lignesSQL.push('');

  for (const table of TABLES_SAUVEGARDE) {
    const [rows] = await db.query(`SELECT * FROM \`${table}\``);
    lignesSQL.push(`-- Table : ${table} (${rows.length} ligne(s))`);
    lignesSQL.push(`TRUNCATE TABLE \`${table}\`;`);

    for (const row of rows) {
      const colonnes = Object.keys(row);
      const valeurs = colonnes.map((col) => db.escape(row[col]));
      lignesSQL.push(
        `INSERT INTO \`${table}\` (\`${colonnes.join('`, `')}\`) VALUES (${valeurs.join(', ')});`
      );
    }
    lignesSQL.push('');
  }

  lignesSQL.push('SET FOREIGN_KEY_CHECKS=1;');
  return lignesSQL.join('\n');
}

module.exports = { findAllResponsables, genererDumpSQL };
