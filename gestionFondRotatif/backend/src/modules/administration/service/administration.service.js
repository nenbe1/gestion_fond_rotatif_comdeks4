const db = require('../../../config/db');
const administrationRepository = require('../repository/administration.repository');
const membreComiteRepository = require('../../membres_comite/repository/membre_comite.repository');
const autoriteRepository = require('../../autorites/repository/autorite.repository');
const beneficiaireRepository = require('../../beneficiaires/repository/beneficiaire.repository');

function erreur(message, statusCode) {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
}

/** Réservé à la Responsable, comme les autres opérations sensibles (voir autres modules). */
async function verifierAppelantEstResponsable(utilisateurId) {
  const [rows] = await db.query(
    'SELECT id FROM responsable_fond_rotatif WHERE utilisateur_id = ? LIMIT 1',
    [utilisateurId]
  );
  if (!rows[0]) {
    throw erreur("Seule la Responsable du Fond Rotatif a accès à l'administration.", 403);
  }
}

/**
 * Vue unifiée de TOUS les comptes, tous rôles confondus — "permissions
 * simples" : pas de nouveau système de permissions configurable, chaque
 * rôle garde ses règles déjà codées dans ses propres routes (voir
 * middlewares reserverAuComite / verifierAppelantEstResponsable un peu
 * partout dans le projet). Ce module ne fait que les lister ensemble,
 * pour une vue d'ensemble et pour (dés)activer un compte depuis un seul
 * endroit plutôt que de naviguer entre 4 pages différentes.
 */
async function consulterTousLesUtilisateurs(utilisateurId) {
  await verifierAppelantEstResponsable(utilisateurId);

  const [responsables, membresComite, autorites, beneficiaires] = await Promise.all([
    administrationRepository.findAllResponsables(),
    membreComiteRepository.findAll(),
    autoriteRepository.findAll(),
    beneficiaireRepository.findAll(),
  ]);

  const utilisateurs = [
    ...responsables.map((r) => ({
      id: r.id, utilisateurId: r.utilisateur_id, role: 'RESPONSABLE',
      nom: r.nom, prenom: r.prenom, telephone: r.telephone, actif: !!r.actif,
    })),
    ...membresComite.map((m) => ({
      id: m.id, utilisateurId: m.utilisateur_id, role: 'MEMBRE_COMITE',
      nom: m.nom, prenom: m.prenom, telephone: m.telephone, actif: !!m.actif,
    })),
    ...autorites.map((a) => ({
      id: a.id, utilisateurId: a.utilisateur_id, role: 'AUTORITE',
      nom: a.nom, prenom: a.prenom, telephone: a.telephone, actif: !!a.actif,
    })),
    ...beneficiaires.map((b) => ({
      id: b.id, utilisateurId: b.utilisateur_id, role: 'BENEFICIAIRE',
      nom: b.nom, prenom: b.prenom, telephone: b.telephone, actif: !!b.actif,
    })),
  ];

  utilisateurs.sort((a, b) => a.nom.localeCompare(b.nom));
  return utilisateurs;
}

/** Sauvegarde manuelle (export SQL des données) — réservée à la Responsable. */
async function genererSauvegarde(utilisateurId) {
  await verifierAppelantEstResponsable(utilisateurId);
  return administrationRepository.genererDumpSQL();
}

module.exports = { consulterTousLesUtilisateurs, genererSauvegarde };
