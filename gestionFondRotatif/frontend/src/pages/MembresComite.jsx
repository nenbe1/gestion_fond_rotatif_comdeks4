import { useEffect, useState } from 'react';
import appelerApi from '../api/client';

/**
 * Page Membres du comité — liste tous les membres et permet d'en créer
 * un nouveau (crée aussi son compte utilisateur, comme pour les
 * bénéficiaires).
 *
 * CORRECTION : le formulaire "Modifier" permet maintenant de corriger
 * nom / prénom / téléphone en plus de fonction / canton (avant, seuls
 * fonction et canton étaient modifiables).
 *
 * "Désactiver"/"Réactiver" par ligne — passe par PUT /membres-comite/:id.
 * On ne supprime jamais un membre du comité (il est référencé par ses
 * demandes/validations passées) — on le désactive, ce qui le retire des
 * listes actives sans casser l'historique.
 */
export default function MembresComite() {
  const [membres, setMembres] = useState([]);
  const [fonctions, setFonctions] = useState([]);
  const [cantons, setCantons] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [voirMotDePasse, setVoirMotDePasse] = useState(false);
  const [formulaire, setFormulaire] = useState({
    nom: '', prenom: '', sexe: 'M', telephone: '', mot_de_passe: '',
    fonction_id: '', canton_id: '',
  });
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const [membreEnEditionId, setMembreEnEditionId] = useState(null);
  const [formulaireEdition, setFormulaireEdition] = useState({
    nom: '', prenom: '', telephone: '', fonction_id: '', canton_id: '',
  });
  const [envoiEditionEnCours, setEnvoiEditionEnCours] = useState(false);
  const [bascculeActifEnCoursId, setBasculeActifEnCoursId] = useState(null);

  async function chargerDonnees() {
    setChargement(true);
    try {
      const [m, f, c] = await Promise.all([
        appelerApi('/membres-comite'),
        appelerApi('/membres-comite/reference/fonctions'),
        appelerApi('/membres-comite/reference/cantons'),
      ]);
      setMembres(m.membres);
      setFonctions(f.fonctions);
      setCantons(c.cantons);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { chargerDonnees(); }, []);

  function gererChangement(e) {
    setFormulaire({ ...formulaire, [e.target.name]: e.target.value });
  }

  async function gererCreation(e) {
    e.preventDefault();
    setErreur('');
    setEnvoiEnCours(true);
    try {
      await appelerApi('/membres-comite', { method: 'POST', body: formulaire });
      setAfficherFormulaire(false);
      setVoirMotDePasse(false);
      setFormulaire({ nom: '', prenom: '', sexe: 'M', telephone: '', mot_de_passe: '', fonction_id: '', canton_id: '' });
      await chargerDonnees();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  function ouvrirEdition(membre) {
    setMembreEnEditionId(membre.id);
    setFormulaireEdition({
      nom: membre.nom,
      prenom: membre.prenom,
      telephone: membre.telephone,
      fonction_id: membre.fonctionId,
      canton_id: membre.cantonId,
    });
  }

  async function gererEnregistrementEdition(e, membre) {
    e.preventDefault();
    setErreur('');
    setEnvoiEditionEnCours(true);
    try {
      await appelerApi(`/membres-comite/${membre.id}`, {
        method: 'PUT',
        body: { ...formulaireEdition, actif: membre.actif },
      });
      setMembreEnEditionId(null);
      await chargerDonnees();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiEditionEnCours(false);
    }
  }

  async function gererBasculeActif(membre) {
    const nouvelEtat = !membre.actif;
    const message = nouvelEtat
      ? 'Réactiver ce membre du comité ?'
      : 'Désactiver ce membre du comité ? Il ne pourra plus se connecter, mais son historique reste conservé.';
    if (!window.confirm(message)) return;

    setErreur('');
    setBasculeActifEnCoursId(membre.id);
    try {
      await appelerApi(`/membres-comite/${membre.id}`, {
        method: 'PUT',
        body: {
          nom: membre.nom, prenom: membre.prenom, telephone: membre.telephone,
          fonction_id: membre.fonctionId, canton_id: membre.cantonId, actif: nouvelEtat,
        },
      });
      await chargerDonnees();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setBasculeActifEnCoursId(null);
    }
  }

  return (
    <div>
      <div className="entete-page">
        <h1>Membres du comité</h1>
        <button onClick={() => setAfficherFormulaire(!afficherFormulaire)}>
          {afficherFormulaire ? 'Annuler' : '+ Nouveau membre'}
        </button>
      </div>

      {erreur && <p className="message-erreur">{erreur}</p>}

      {afficherFormulaire && (
        <form className="formulaire-carte" onSubmit={gererCreation}>
          <div className="grille-formulaire">
            <label>Nom <input name="nom" value={formulaire.nom} onChange={gererChangement} required /></label>
            <label>Prénom <input name="prenom" value={formulaire.prenom} onChange={gererChangement} required /></label>
            <label>
              Sexe
              <select name="sexe" value={formulaire.sexe} onChange={gererChangement}>
                <option value="M">M</option>
                <option value="F">F</option>
              </select>
            </label>
            <label>Téléphone <input name="telephone" value={formulaire.telephone} onChange={gererChangement} required /></label>
            <label>
              Mot de passe
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type={voirMotDePasse ? 'text' : 'password'}
                  name="mot_de_passe"
                  value={formulaire.mot_de_passe}
                  onChange={gererChangement}
                  required
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => setVoirMotDePasse(!voirMotDePasse)}
                  title={voirMotDePasse ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}
                >
                  {voirMotDePasse ? '🙈' : '👁️'}
                </button>
              </div>
            </label>
            <label>
              Fonction
              <select name="fonction_id" value={formulaire.fonction_id} onChange={gererChangement} required>
                <option value="">-- Choisir --</option>
                {fonctions.map((f) => <option key={f.id} value={f.id}>{f.libelle}</option>)}
              </select>
            </label>
            <label>
              Canton
              <select name="canton_id" value={formulaire.canton_id} onChange={gererChangement} required>
                <option value="">-- Choisir --</option>
                {cantons.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </label>
          </div>
          <button type="submit" disabled={envoiEnCours}>{envoiEnCours ? 'Création...' : 'Créer le membre'}</button>
        </form>
      )}

      {chargement ? (
        <p>Chargement...</p>
      ) : (
        <table className="tableau">
          <thead>
            <tr>
              <th>Nom</th><th>Prénom</th><th>Fonction</th><th>Canton</th><th>Téléphone</th><th>Actif</th><th></th>
            </tr>
          </thead>
          <tbody>
            {membres.map((m) => (
              <tr key={m.id}>
                {membreEnEditionId === m.id ? (
                  <>
                    <td>
                      <input
                        value={formulaireEdition.nom}
                        onChange={(e) => setFormulaireEdition({ ...formulaireEdition, nom: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        value={formulaireEdition.prenom}
                        onChange={(e) => setFormulaireEdition({ ...formulaireEdition, prenom: e.target.value })}
                      />
                    </td>
                    <td>
                      <select
                        value={formulaireEdition.fonction_id}
                        onChange={(e) => setFormulaireEdition({ ...formulaireEdition, fonction_id: e.target.value })}
                      >
                        {fonctions.map((f) => <option key={f.id} value={f.id}>{f.libelle}</option>)}
                      </select>
                    </td>
                    <td>
                      <select
                        value={formulaireEdition.canton_id}
                        onChange={(e) => setFormulaireEdition({ ...formulaireEdition, canton_id: e.target.value })}
                      >
                        {cantons.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                      </select>
                    </td>
                    <td>
                      <input
                        value={formulaireEdition.telephone}
                        onChange={(e) => setFormulaireEdition({ ...formulaireEdition, telephone: e.target.value })}
                      />
                    </td>
                    <td>{m.actif ? '✅' : '❌'}</td>
                    <td className="actions-ligne">
                      <button disabled={envoiEditionEnCours} onClick={(e) => gererEnregistrementEdition(e, m)}>
                        {envoiEditionEnCours ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                      <button type="button" onClick={() => setMembreEnEditionId(null)}>Annuler</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{m.nom}</td>
                    <td>{m.prenom}</td>
                    <td>{m.fonctionLibelle}</td>
                    <td>{m.cantonNom}</td>
                    <td>{m.telephone}</td>
                    <td>{m.actif ? '✅' : '❌'}</td>
                    <td className="actions-ligne">
                      <button className="bouton-icone" title="Modifier" onClick={() => ouvrirEdition(m)}>✏️</button>
                      <button
                        className={`bouton-icone ${m.actif ? 'bouton-danger' : ''}`}
                        title={m.actif ? 'Désactiver' : 'Réactiver'}
                        disabled={bascculeActifEnCoursId === m.id}
                        onClick={() => gererBasculeActif(m)}
                      >
                        {bascculeActifEnCoursId === m.id ? '...' : (m.actif ? '🔒' : '🔓')}
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {membres.length === 0 && (
              <tr><td colSpan="7" className="vide">Aucun membre du comité pour l'instant.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
