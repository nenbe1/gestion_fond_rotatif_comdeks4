const db = require('../../../config/db');
const financementRepository = require('../repository/financement.repository');
const Financement = require('../model/financement.model');

function erreur(message, statusCode) {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
}

async function getProgrammeNom(programmeId) {
  const [rows] = await db.query('SELECT nom FROM programme WHERE id = ? LIMIT 1', [programmeId]);
  if (!rows[0]) throw erreur('Programme introuvable.', 404);
  return rows[0].nom;
}

async function getDemande(demandeId) {
  const [rows] = await db.query(
    'SELECT id, montant_demande, statut_global FROM demande_financement WHERE id = ? LIMIT 1',
    [demandeId]
  );
  return rows[0] || null;
}

function genererCodeFinancement(programmeNom, annee, numeroOrdre) {
  const ordre = String(numeroOrdre).padStart(5, '0');
  return `${programmeNom}/AJT/FR/${annee}/${ordre}`;
}

/**
 * Crée le Financement une fois la DemandeFinancement approuvée par la
 * Responsable du Fond Rotatif (après validation interne du comité aux
 * 3 niveaux). Appelé par demandes_financement.service.decisionResponsable.
 * Débite le fonds ET met à jour le statut de la demande dans la même
 * transaction.
 */
async function creerDepuisDemande(demandeId, { fond_rotatif_id, programme_id, responsable_id }) {
  if (!fond_rotatif_id || !programme_id || !responsable_id) {
    throw erreur('fond_rotatif_id, programme_id et responsable_id sont requis pour créer le financement.', 400);
  }

  const demande = await getDemande(demandeId);
  if (!demande) throw erreur('Demande de financement introuvable.', 404);
  if (demande.statut_global !== 'EnAttenteResponsable') {
    throw erreur("La demande doit être approuvée par le comité (statut EnAttenteResponsable) avant que la Responsable ne puisse décider.", 409);
  }

  const existant = await financementRepository.findByDemandeId(demandeId);
  if (existant) throw erreur('Un financement existe déjà pour cette demande.', 409);

  const programmeNom = await getProgrammeNom(programme_id);
  const annee = new Date().getFullYear();
  const nbExistants = await financementRepository.compterFinancementsAnnee(annee);
  const codeFinancement = genererCodeFinancement(programmeNom, annee, nbExistants + 1);
  const tauxMajoration = await financementRepository.getTauxMajoration();

  // Transaction : créer le financement, débiter le fonds, ET faire passer
  // la demande à "Validee" — tout ou rien.
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO financement
        (code_financement, demande_financement_id, fond_rotatif_id, programme_id,
         responsable_id, montant_financement, date_decaissement, statut, taux_majoration_applique)
       VALUES (?, ?, ?, ?, ?, ?, CURDATE(), 'Actif', ?)`,
      [
        codeFinancement, demandeId, fond_rotatif_id, programme_id,
        responsable_id, demande.montant_demande, tauxMajoration,
      ]
    );

    await financementRepository.debiterFond(connection, fond_rotatif_id, demande.montant_demande);

    await connection.query(
      `UPDATE demande_financement SET statut_global = 'Validee' WHERE id = ?`,
      [demandeId]
    );

    await connection.commit();
    return Financement.fromRow(await financementRepository.findById(result.insertId));
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function consulterTous() {
  const rows = await financementRepository.findAll();
  return rows.map(Financement.fromRow);
}

async function consulterParId(id) {
  const row = await financementRepository.findById(id);
  if (!row) throw erreur('Financement introuvable.', 404);
  return Financement.fromRow(row);
}

module.exports = { creerDepuisDemande, consulterTous, consulterParId };
