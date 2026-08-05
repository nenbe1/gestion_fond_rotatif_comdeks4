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

async function getFond(fondId) {
  const [rows] = await db.query('SELECT id FROM fond_rotatif WHERE id = ? LIMIT 1', [fondId]);
  if (!rows[0]) throw erreur('Fonds rotatif introuvable.', 404);
  return rows[0];
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

async function verifierAppelantEstResponsable(utilisateurId) {
  const [rows] = await db.query(
    'SELECT id FROM responsable_fond_rotatif WHERE utilisateur_id = ? LIMIT 1',
    [utilisateurId]
  );
  if (!rows[0]) {
    throw erreur('Seule la Responsable du Fond Rotatif peut gérer les financements.', 403);
  }
}

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

async function consulterTous(cantonId) {
  const rows = await financementRepository.findAll({ cantonId });
  return rows.map(Financement.fromRow);
}

async function consulterParId(id) {
  const row = await financementRepository.findById(id);
  if (!row) throw erreur('Financement introuvable.', 404);
  return Financement.fromRow(row);
}

/**
 * CORRECTION : modifier() couvre maintenant programme_id, fond_rotatif_id
 * ET montant_financement (avant, seul le programme était modifiable —
 * comme pour Membre du comité où seuls fonction/canton l'étaient au
 * départ). Le programme reste toujours modifiable sans condition
 * (aucun impact financier). Changer le montant ou le fonds source reste
 * interdit si des bénéficiaires ont déjà reçu une répartition dessus —
 * l'argent est alors déjà "sur le terrain", le modifier casserait la
 * traçabilité. Si autorisé, le changement de montant/fonds est fait
 * dans une transaction : on annule l'ancien débit puis on applique le
 * nouveau, pour que le solde du fonds reste toujours exact.
 */
async function modifier(utilisateurId, id, { programme_id, fond_rotatif_id, montant_financement }) {
  await verifierAppelantEstResponsable(utilisateurId);

  const financement = await consulterParId(id);

  const programmeIdFinal = programme_id !== undefined ? programme_id : financement.programmeId;
  const fondIdFinal = fond_rotatif_id !== undefined ? fond_rotatif_id : financement.fondRotatifId;
  const montantFinal = montant_financement !== undefined ? Number(montant_financement) : Number(financement.montantFinancement);

  const changeMontantOuFond = Number(fondIdFinal) !== Number(financement.fondRotatifId)
    || montantFinal !== Number(financement.montantFinancement);

  if (changeMontantOuFond) {
    const nbAttributions = await financementRepository.compterAttributions(id);
    if (nbAttributions > 0) {
      throw erreur(
        "Impossible de modifier le montant ou le fonds source : des bénéficiaires ont déjà reçu une répartition sur ce financement. Seul le programme reste modifiable dans ce cas.",
        409
      );
    }
    if (montantFinal <= 0) {
      throw erreur('Le montant doit être positif.', 400);
    }
    await getFond(fondIdFinal);
  }

  await getProgrammeNom(programmeIdFinal);

  if (changeMontantOuFond) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      // Annule l'ancien débit (recrédite l'ancien fonds de l'ancien montant),
      // puis applique le nouveau débit (nouveau fonds, nouveau montant).
      await financementRepository.crediterFond(connection, financement.fondRotatifId, financement.montantFinancement);
      await financementRepository.debiterFond(connection, fondIdFinal, montantFinal);
      await financementRepository.modifier(connection, id, {
        programme_id: programmeIdFinal, fond_rotatif_id: fondIdFinal, montant_financement: montantFinal,
      });
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } else {
    await financementRepository.modifier(db, id, {
      programme_id: programmeIdFinal, fond_rotatif_id: fondIdFinal, montant_financement: montantFinal,
    });
  }

  return consulterParId(id);
}

async function supprimer(utilisateurId, id) {
  await verifierAppelantEstResponsable(utilisateurId);

  const financement = await consulterParId(id);

  const nbAttributions = await financementRepository.compterAttributions(id);
  if (nbAttributions > 0) {
    throw erreur(
      "Impossible de supprimer : des bénéficiaires ont déjà reçu une répartition sur ce financement. La suppression casserait la traçabilité de l'argent déjà réparti.",
      409
    );
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    await financementRepository.crediterFond(connection, financement.fondRotatifId, financement.montantFinancement);

    await connection.query(
      `UPDATE demande_financement SET statut_global = 'EnAttenteResponsable' WHERE id = ?`,
      [financement.demandeFinancementId]
    );

    await financementRepository.supprimer(connection, id);

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = { creerDepuisDemande, consulterTous, consulterParId, modifier, supprimer };
