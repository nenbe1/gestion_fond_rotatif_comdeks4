const db = require('../../../config/db');
const cotisationRepository = require('../repository/cotisation.repository');
const Cotisation = require('../model/cotisation.model');

function erreur(message, statusCode) {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
}

function genererCodeCotisation(annee, numeroOrdre) {
  return `COT-${annee}-${String(numeroOrdre).padStart(5, '0')}`;
}

async function getGroupe(groupeId) {
  const [rows] = await db.query('SELECT id, canton_id, actif FROM groupe_mmf WHERE id = ? LIMIT 1', [groupeId]);
  return rows[0] || null;
}

async function verifierMembreActif(groupeId, beneficiaireId) {
  const [rows] = await db.query(
    'SELECT id FROM adhesion_groupe WHERE groupe_mmf_id = ? AND beneficiaire_id = ? AND actif = TRUE LIMIT 1',
    [groupeId, beneficiaireId]
  );
  return rows.length > 0;
}

/**
 * Enregistre une cotisation — le bénéficiaire doit être membre ACTIF du
 * groupe concerné (pas de cotisation pour un groupe qu'on a quitté ou
 * dont on ne fait pas partie). Enregistré par le membre du comité
 * connecté (comme les remboursements individuels).
 */
async function creer({ groupe_mmf_id, beneficiaire_id, montant, date_versement, observation }, membreComiteId, cantonIdAppelant) {
  const groupe = await getGroupe(groupe_mmf_id);
  if (!groupe) throw erreur('Groupe MMF introuvable.', 404);
  if (!groupe.actif) throw erreur('Ce groupe est désactivé.', 409);

  if (cantonIdAppelant && groupe.canton_id !== cantonIdAppelant) {
    throw erreur('Ce groupe appartient à un autre canton.', 403);
  }

  const estMembre = await verifierMembreActif(groupe_mmf_id, beneficiaire_id);
  if (!estMembre) throw erreur("Ce bénéficiaire n'est pas membre actif de ce groupe.", 409);

  if (Number(montant) <= 0) throw erreur('Le montant doit être positif.', 400);

  const annee = new Date().getFullYear();
  const nbExistantes = await cotisationRepository.compterAnnee(annee);
  const codeCotisation = genererCodeCotisation(annee, nbExistantes + 1);

  const row = await cotisationRepository.create({
    code_cotisation: codeCotisation,
    groupe_mmf_id,
    beneficiaire_id,
    montant,
    date_versement: date_versement || new Date().toISOString().slice(0, 10),
    observation,
    enregistre_par: membreComiteId,
  });

  return Cotisation.fromRow(row);
}

/** Historique/recherche — filtres tous optionnels (voir repository.rechercher). */
async function rechercher(filtres) {
  const rows = await cotisationRepository.rechercher(filtres);
  return rows.map(Cotisation.fromRow);
}

async function consulterParId(id) {
  const row = await cotisationRepository.findById(id);
  if (!row) throw erreur('Cotisation introuvable.', 404);
  return Cotisation.fromRow(row);
}

async function consulterTotalBeneficiaireGroupe(beneficiaireId, groupeId) {
  return cotisationRepository.sommeParBeneficiaireEtGroupe(beneficiaireId, groupeId);
}

module.exports = { creer, rechercher, consulterParId, consulterTotalBeneficiaireGroupe };
