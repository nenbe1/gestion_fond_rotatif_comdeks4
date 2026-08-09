import { useEffect, useState } from 'react';
import appelerApi from '../api/client';

const FORMULAIRE_VIDE = {
  nom: '', prenom: '', sexe: 'F', telephone: '', mot_de_passe: '',
  fonction: '', type_critere: 'DOMAINE', domaine_id: '', valeur_critere: '',
};

const LIBELLE_TYPE_CRITERE = {
  DOMAINE: 'Domaine',
  SEXE: 'Sexe',
  AGE_MAX: 'Âge maximum',
};

/**
 * Page Autorités — délégués institutionnels (Jeunesse, Femmes,
 * Agriculture...) avec un accès Web dédié, en lecture seule, à des
 * statistiques globales filtrées par un seul critère. Créés et modifiés
 * uniquement par la Responsable (jamais en libre-service : le critère
 * détermine quelles données sensibles le compte pourra consulter).
 *
 * AJOUT : Modifier (nom/prénom/téléphone/fonction/critère) et Désactiver/
 * Réactiver par ligne. On ne supprime jamais un délégué (il reste
 * référencé), on le désactive.
 */
export default function Autorites() {
  const [autorites, setAutorites] = useState([]);
  const [domaines, setDomaines] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [formulaire, setFormulaire] = useState(FORMULAIRE_VIDE);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);

  const [autoriteEnEditionId, setAutoriteEnEditionId] = useState(null);
  const [formulaireEdition, setFormulaireEdition] = useState(null);
  const [envoiEditionEnCours, setEnvoiEditionEnCours] = useState(false);
  const [bascculeActifEnCoursId, setBasculeActifEnCoursId] = useState(null);

  async function chargerDonnees() {
    setChargement(true);
    try {
      const [a, d] = await Promise.all([
        appelerApi('/autorites'),
        appelerApi('/domaines'),
      ]);
      setAutorites(a.autorites);
      setDomaines(d.domaines);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { chargerDonnees(); }, []);

  function gererChangement(e) {
    const { name, value } = e.target;
    if (name === 'type_critere') {
      setFormulaire({ ...formulaire, type_critere: value, domaine_id: '', valeur_critere: '' });
    } else {
      setFormulaire({ ...formulaire, [name]: value });
    }
  }

  async function gererCreation(e) {
    e.preventDefault();
    setErreur('');
    setEnvoiEnCours(true);
    try {
      await appelerApi('/autorites', { method: 'POST', body: formulaire });
      setAfficherFormulaire(false);
      setFormulaire(FORMULAIRE_VIDE);
      await chargerDonnees();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  function libelleCritere(a) {
    if (a.typeCritere === 'DOMAINE') return `Domaine : ${a.domaineNom ?? '—'}`;
    if (a.typeCritere === 'SEXE') return `Sexe : ${a.valeurCritere}`;
    return `Âge <= ${a.valeurCritere} ans`;
  }

  function ouvrirEdition(a) {
    setAutoriteEnEditionId(a.id);
    setFormulaireEdition({
      nom: a.nom, prenom: a.prenom, telephone: a.telephone, fonction: a.fonction,
      type_critere: a.typeCritere, domaine_id: a.domaineId || '', valeur_critere: a.valeurCritere || '',
    });
  }

  function gererChangementEdition(e) {
    const { name, value } = e.target;
    if (name === 'type_critere') {
      setFormulaireEdition({ ...formulaireEdition, type_critere: value, domaine_id: '', valeur_critere: '' });
    } else {
      setFormulaireEdition({ ...formulaireEdition, [name]: value });
    }
  }

  async function gererEnregistrementEdition(e, a) {
    e.preventDefault();
    setErreur('');
    setEnvoiEditionEnCours(true);
    try {
      await appelerApi(`/autorites/${a.id}`, {
        method: 'PUT',
        body: { ...formulaireEdition, actif: a.actif },
      });
      setAutoriteEnEditionId(null);
      await chargerDonnees();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiEditionEnCours(false);
    }
  }

  async function gererBasculeActif(a) {
    const nouvelEtat = !a.actif;
    const message = nouvelEtat
      ? 'Réactiver ce délégué ?'
      : 'Désactiver ce délégué ? Il ne pourra plus se connecter, mais son historique reste conservé.';
    if (!window.confirm(message)) return;

    setErreur('');
    setBasculeActifEnCoursId(a.id);
    try {
      await appelerApi(`/autorites/${a.id}`, {
        method: 'PUT',
        body: {
          nom: a.nom, prenom: a.prenom, telephone: a.telephone, fonction: a.fonction,
          type_critere: a.typeCritere, domaine_id: a.domaineId, valeur_critere: a.valeurCritere,
          actif: nouvelEtat,
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
        <h1>Autorités (délégués)</h1>
        <button onClick={() => setAfficherFormulaire(!afficherFormulaire)}>
          {afficherFormulaire ? 'Annuler' : '+ Nouveau délégué'}
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
                <option value="F">F</option>
                <option value="M">M</option>
              </select>
            </label>
            <label>Téléphone <input name="telephone" value={formulaire.telephone} onChange={gererChangement} required /></label>
            <label>
              Mot de passe
              <div className="champ-mot-de-passe">
                <input
                  type={motDePasseVisible ? 'text' : 'password'}
                  name="mot_de_passe"
                  value={formulaire.mot_de_passe}
                  onChange={gererChangement}
                  required
                />
                <button
                  type="button"
                  className="bouton-oeil"
                  onClick={() => setMotDePasseVisible(!motDePasseVisible)}
                  aria-label={motDePasseVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  tabIndex={-1}
                >
                  {motDePasseVisible ? '🙈' : '👁'}
                </button>
              </div>
            </label>
            <label className="pleine-largeur">
              Fonction <input name="fonction" placeholder='Ex : "Délégué départemental de la Jeunesse"' value={formulaire.fonction} onChange={gererChangement} required />
            </label>

            <label>
              Critère d'accès
              <select name="type_critere" value={formulaire.type_critere} onChange={gererChangement}>
                {Object.entries(LIBELLE_TYPE_CRITERE).map(([valeur, libelle]) => (
                  <option key={valeur} value={valeur}>{libelle}</option>
                ))}
              </select>
            </label>

            {formulaire.type_critere === 'DOMAINE' && (
              <label>
                Domaine concerné
                <select name="domaine_id" value={formulaire.domaine_id} onChange={gererChangement} required>
                  <option value="">-- Choisir --</option>
                  {domaines.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
                </select>
              </label>
            )}

            {formulaire.type_critere === 'SEXE' && (
              <label>
                Sexe concerné
                <select name="valeur_critere" value={formulaire.valeur_critere} onChange={gererChangement} required>
                  <option value="">-- Choisir --</option>
                  <option value="F">Femmes (F)</option>
                  <option value="M">Hommes (M)</option>
                </select>
              </label>
            )}

            {formulaire.type_critere === 'AGE_MAX' && (
              <label>
                Âge maximum (ex : 30 pour "jeunesse")
                <input type="number" name="valeur_critere" min="1" value={formulaire.valeur_critere} onChange={gererChangement} required />
              </label>
            )}
          </div>
          <button type="submit" disabled={envoiEnCours}>{envoiEnCours ? 'Création...' : 'Créer le délégué'}</button>
        </form>
      )}

      {chargement ? (
        <p>Chargement...</p>
      ) : (
        <table className="tableau">
          <thead>
            <tr>
              <th>Nom</th><th>Prénom</th><th>Téléphone</th><th>Fonction</th><th>Critère</th><th>Actif</th><th></th>
            </tr>
          </thead>
          <tbody>
            {autorites.map((a) => (
              <tr key={a.id}>
                {autoriteEnEditionId === a.id ? (
                  <>
                    <td><input value={formulaireEdition.nom} onChange={(e) => setFormulaireEdition({ ...formulaireEdition, nom: e.target.value })} /></td>
                    <td><input value={formulaireEdition.prenom} onChange={(e) => setFormulaireEdition({ ...formulaireEdition, prenom: e.target.value })} /></td>
                    <td><input value={formulaireEdition.telephone} onChange={(e) => setFormulaireEdition({ ...formulaireEdition, telephone: e.target.value })} /></td>
                    <td><input value={formulaireEdition.fonction} onChange={(e) => setFormulaireEdition({ ...formulaireEdition, fonction: e.target.value })} /></td>
                    <td>
                      <select name="type_critere" value={formulaireEdition.type_critere} onChange={gererChangementEdition}>
                        {Object.entries(LIBELLE_TYPE_CRITERE).map(([valeur, libelle]) => (
                          <option key={valeur} value={valeur}>{libelle}</option>
                        ))}
                      </select>
                      {formulaireEdition.type_critere === 'DOMAINE' && (
                        <select name="domaine_id" value={formulaireEdition.domaine_id} onChange={gererChangementEdition} required>
                          <option value="">-- Domaine --</option>
                          {domaines.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
                        </select>
                      )}
                      {formulaireEdition.type_critere === 'SEXE' && (
                        <select name="valeur_critere" value={formulaireEdition.valeur_critere} onChange={gererChangementEdition} required>
                          <option value="">-- Sexe --</option>
                          <option value="F">F</option>
                          <option value="M">M</option>
                        </select>
                      )}
                      {formulaireEdition.type_critere === 'AGE_MAX' && (
                        <input
                          type="number" min="1" name="valeur_critere"
                          value={formulaireEdition.valeur_critere} onChange={gererChangementEdition} required
                        />
                      )}
                    </td>
                    <td>{a.actif ? '✅' : '❌'}</td>
                    <td className="actions-ligne">
                      <button disabled={envoiEditionEnCours} onClick={(e) => gererEnregistrementEdition(e, a)}>
                        {envoiEditionEnCours ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                      <button type="button" onClick={() => setAutoriteEnEditionId(null)}>Annuler</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{a.nom}</td>
                    <td>{a.prenom}</td>
                    <td>{a.telephone}</td>
                    <td>{a.fonction}</td>
                    <td>{libelleCritere(a)}</td>
                    <td>{a.actif ? '✅' : '❌'}</td>
                    <td className="actions-ligne">
                      <button className="bouton-icone" title="Modifier" onClick={() => ouvrirEdition(a)}>✏️</button>
                      <button
                        className={`bouton-icone ${a.actif ? 'bouton-danger' : ''}`}
                        title={a.actif ? 'Désactiver' : 'Réactiver'}
                        disabled={bascculeActifEnCoursId === a.id}
                        onClick={() => gererBasculeActif(a)}
                      >
                        {bascculeActifEnCoursId === a.id ? '...' : (a.actif ? '🔒' : '🔓')}
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {autorites.length === 0 && (
              <tr><td colSpan="7" className="vide">Aucun délégué pour l'instant.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
