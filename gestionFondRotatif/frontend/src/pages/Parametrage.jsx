import { useEffect, useState } from 'react';
import appelerApi from '../api/client';

/**
 * Page Paramétrage — gestion centralisée des cantons et des fonctions
 * (+ leurs habilitations). Réservée à la Responsable pour les actions
 * de modification (la lecture, elle, est ouverte à tout le monde côté
 * API — plusieurs écrans Mobile s'en servent pour leurs formulaires).
 *
 * Séparé du module "Paramètres" (taux de majoration, clé/valeur) qui a
 * son propre usage ailleurs — pas touché ici.
 */
export default function Parametrage() {
  const [onglet, setOnglet] = useState('cantons'); // 'cantons' | 'fonctions' | 'parametres'

  return (
    <div>
      <h1>Paramétrage</h1>

      <div className="onglets">
        <button className={onglet === 'cantons' ? 'onglet-actif' : 'onglet'} onClick={() => setOnglet('cantons')}>Cantons</button>
        <button className={onglet === 'fonctions' ? 'onglet-actif' : 'onglet'} onClick={() => setOnglet('fonctions')}>Fonctions & habilitations</button>
        <button className={onglet === 'parametres' ? 'onglet-actif' : 'onglet'} onClick={() => setOnglet('parametres')}>Paramètres système</button>
      </div>

      {onglet === 'cantons' && <OngletCantons />}
      {onglet === 'fonctions' && <OngletFonctions />}
      {onglet === 'parametres' && <OngletParametres />}
    </div>
  );
}

function OngletCantons() {
  const [cantons, setCantons] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [formulaire, setFormulaire] = useState({ nom: '', latitude: '', longitude: '' });
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [enEditionId, setEnEditionId] = useState(null);
  const [formulaireEdition, setFormulaireEdition] = useState({ nom: '', latitude: '', longitude: '' });
  const [basculeEnCoursId, setBasculeEnCoursId] = useState(null);

  async function charger() {
    setChargement(true);
    try {
      const donnees = await appelerApi('/parametrage/cantons');
      setCantons(donnees.cantons);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { charger(); }, []);

  async function gererCreation(e) {
    e.preventDefault();
    setErreur('');
    setEnvoiEnCours(true);
    try {
      await appelerApi('/parametrage/cantons', { method: 'POST', body: formulaire });
      setFormulaire({ nom: '', latitude: '', longitude: '' });
      setAfficherFormulaire(false);
      await charger();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  function ouvrirEdition(c) {
    setEnEditionId(c.id);
    setFormulaireEdition({ nom: c.nom, latitude: c.latitude ?? '', longitude: c.longitude ?? '' });
  }

  async function gererEnregistrementEdition(c) {
    setErreur('');
    setEnvoiEnCours(true);
    try {
      await appelerApi(`/parametrage/cantons/${c.id}`, { method: 'PUT', body: formulaireEdition });
      setEnEditionId(null);
      await charger();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  async function gererBascule(c) {
    const nouvelEtat = !c.actif;
    if (!window.confirm(nouvelEtat ? 'Réactiver ce canton ?' : "Désactiver ce canton ? Il n'apparaîtra plus dans les listes de choix pour de nouvelles créations.")) return;
    setErreur('');
    setBasculeEnCoursId(c.id);
    try {
      await appelerApi(`/parametrage/cantons/${c.id}/${nouvelEtat ? 'activer' : 'desactiver'}`, { method: 'PUT' });
      await charger();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setBasculeEnCoursId(null);
    }
  }

  return (
    <div>
      <div className="entete-page">
        <h2>Cantons</h2>
        <button onClick={() => setAfficherFormulaire(!afficherFormulaire)}>{afficherFormulaire ? 'Annuler' : '+ Nouveau canton'}</button>
      </div>

      {erreur && <p className="message-erreur">{erreur}</p>}

      {afficherFormulaire && (
        <form className="formulaire-carte" onSubmit={gererCreation}>
          <div className="grille-formulaire">
            <label>Nom <input value={formulaire.nom} onChange={(e) => setFormulaire({ ...formulaire, nom: e.target.value })} required /></label>
            <label>Latitude (optionnel) <input type="number" step="any" value={formulaire.latitude} onChange={(e) => setFormulaire({ ...formulaire, latitude: e.target.value })} /></label>
            <label>Longitude (optionnel) <input type="number" step="any" value={formulaire.longitude} onChange={(e) => setFormulaire({ ...formulaire, longitude: e.target.value })} /></label>
          </div>
          <button type="submit" disabled={envoiEnCours}>{envoiEnCours ? 'Création...' : 'Créer le canton'}</button>
        </form>
      )}

      {chargement ? <p>Chargement...</p> : (
        <table className="tableau">
          <thead><tr><th>Nom</th><th>Latitude</th><th>Longitude</th><th>Actif</th><th></th></tr></thead>
          <tbody>
            {cantons.map((c) => (
              <tr key={c.id}>
                {enEditionId === c.id ? (
                  <>
                    <td><input value={formulaireEdition.nom} onChange={(e) => setFormulaireEdition({ ...formulaireEdition, nom: e.target.value })} /></td>
                    <td><input type="number" step="any" value={formulaireEdition.latitude} onChange={(e) => setFormulaireEdition({ ...formulaireEdition, latitude: e.target.value })} /></td>
                    <td><input type="number" step="any" value={formulaireEdition.longitude} onChange={(e) => setFormulaireEdition({ ...formulaireEdition, longitude: e.target.value })} /></td>
                    <td>{c.actif ? '✅' : '❌'}</td>
                    <td className="actions-ligne">
                      <button disabled={envoiEnCours} onClick={() => gererEnregistrementEdition(c)}>{envoiEnCours ? '...' : 'Enregistrer'}</button>
                      <button type="button" onClick={() => setEnEditionId(null)}>Annuler</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{c.nom}</td>
                    <td>{c.latitude ?? '—'}</td>
                    <td>{c.longitude ?? '—'}</td>
                    <td>{c.actif ? '✅' : '❌'}</td>
                    <td className="actions-ligne">
                      <button className="bouton-icone" title="Modifier" onClick={() => ouvrirEdition(c)}>✏️</button>
                      <button
                        className={`bouton-icone ${c.actif ? 'bouton-danger' : ''}`}
                        title={c.actif ? 'Désactiver' : 'Réactiver'}
                        disabled={basculeEnCoursId === c.id}
                        onClick={() => gererBascule(c)}
                      >
                        {basculeEnCoursId === c.id ? '...' : (c.actif ? '🔒' : '🔓')}
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {cantons.length === 0 && <tr><td colSpan="5" className="vide">Aucun canton pour l'instant.</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}

function OngletFonctions() {
  const [fonctions, setFonctions] = useState([]);
  const [habilitations, setHabilitations] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [formulaire, setFormulaire] = useState({ code: '', libelle: '' });
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [fonctionOuverteId, setFonctionOuverteId] = useState(null); // édition des habilitations
  const [habilitationsChoisies, setHabilitationsChoisies] = useState([]);
  const CODES_PROTEGES = ['TRESORIER', 'COMMISSAIRE', 'PRESIDENT'];

  // AJOUT : gestion de la liste "maître" des habilitations elle-même —
  // avant, il n'existait aucun moyen d'en créer une seule depuis
  // l'écran, donc la case à cocher par fonction restait toujours vide.
  const [afficherFormulaireHabilitation, setAfficherFormulaireHabilitation] = useState(false);
  const [formulaireHabilitation, setFormulaireHabilitation] = useState({ code: '', libelle: '' });
  const [envoiHabilitationEnCours, setEnvoiHabilitationEnCours] = useState(false);

  async function charger() {
    setChargement(true);
    try {
      const [f, h] = await Promise.all([
        appelerApi('/parametrage/fonctions'),
        appelerApi('/parametrage/habilitations'),
      ]);
      setFonctions(f.fonctions);
      setHabilitations(h.habilitations);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { charger(); }, []);

  async function gererCreation(e) {
    e.preventDefault();
    setErreur('');
    setEnvoiEnCours(true);
    try {
      await appelerApi('/parametrage/fonctions', { method: 'POST', body: formulaire });
      setFormulaire({ code: '', libelle: '' });
      setAfficherFormulaire(false);
      await charger();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  async function gererSuppression(f) {
    if (!window.confirm(`Supprimer la fonction "${f.libelle}" ?`)) return;
    setErreur('');
    try {
      await appelerApi(`/parametrage/fonctions/${f.id}`, { method: 'DELETE' });
      await charger();
    } catch (err) {
      setErreur(err.message);
    }
  }

  async function gererCreationHabilitation(e) {
    e.preventDefault();
    setErreur('');
    setEnvoiHabilitationEnCours(true);
    try {
      await appelerApi('/parametrage/habilitations', { method: 'POST', body: formulaireHabilitation });
      setFormulaireHabilitation({ code: '', libelle: '' });
      setAfficherFormulaireHabilitation(false);
      await charger();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiHabilitationEnCours(false);
    }
  }

  async function gererSuppressionHabilitation(h) {
    if (!window.confirm(`Supprimer l'habilitation "${h.libelle}" ? Elle sera retirée de toutes les fonctions qui l'avaient.`)) return;
    setErreur('');
    try {
      await appelerApi(`/parametrage/habilitations/${h.id}`, { method: 'DELETE' });
      await charger();
    } catch (err) {
      setErreur(err.message);
    }
  }

  function ouvrirHabilitations(f) {
    setFonctionOuverteId(f.id);
    setHabilitationsChoisies(f.habilitations.map((h) => h.id));
  }

  function basculerHabilitation(id) {
    setHabilitationsChoisies((liste) =>
      liste.includes(id) ? liste.filter((x) => x !== id) : [...liste, id]
    );
  }

  async function gererEnregistrementHabilitations(f) {
    setErreur('');
    setEnvoiEnCours(true);
    try {
      await appelerApi(`/parametrage/fonctions/${f.id}/habilitations`, {
        method: 'PUT',
        body: { habilitation_ids: habilitationsChoisies },
      });
      setFonctionOuverteId(null);
      await charger();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <div>
      <div className="entete-page">
        <h2>Fonctions</h2>
        <button onClick={() => setAfficherFormulaire(!afficherFormulaire)}>{afficherFormulaire ? 'Annuler' : '+ Nouvelle fonction'}</button>
      </div>

      {erreur && <p className="message-erreur">{erreur}</p>}

      {/* AJOUT : liste + création des habilitations elles-mêmes (la liste "maître" que les fonctions viennent cocher juste en dessous). */}
      <div className="formulaire-carte">
        <div className="entete-page">
          <h3 style={{ margin: 0 }}>Habilitations disponibles</h3>
          <button className="bouton-petit" onClick={() => setAfficherFormulaireHabilitation(!afficherFormulaireHabilitation)}>
            {afficherFormulaireHabilitation ? 'Annuler' : '+ Nouvelle habilitation'}
          </button>
        </div>

        {afficherFormulaireHabilitation && (
          <form className="grille-formulaire" onSubmit={gererCreationHabilitation} style={{ marginTop: '0.8rem' }}>
            <label>
              Code <input
                value={formulaireHabilitation.code}
                onChange={(e) => setFormulaireHabilitation({ ...formulaireHabilitation, code: e.target.value.toUpperCase() })}
                placeholder="EX: CONFIRMER_REMBOURSEMENT"
                required
              />
            </label>
            <label>Libellé <input value={formulaireHabilitation.libelle} onChange={(e) => setFormulaireHabilitation({ ...formulaireHabilitation, libelle: e.target.value })} required /></label>
            <div className="pleine-largeur">
              <button type="submit" disabled={envoiHabilitationEnCours}>{envoiHabilitationEnCours ? 'Création...' : 'Créer l\'habilitation'}</button>
            </div>
          </form>
        )}

        {habilitations.length === 0 ? (
          <p className="note" style={{ marginTop: '0.6rem' }}>Aucune habilitation créée pour l'instant.</p>
        ) : (
          <ul style={{ marginTop: '0.6rem', paddingLeft: '1.2rem' }}>
            {habilitations.map((h) => (
              <li key={h.id} style={{ marginBottom: '0.3rem' }}>
                {h.libelle} <code style={{ color: '#999' }}>({h.code})</code>{' '}
                <button className="bouton-icone bouton-danger" title="Supprimer" onClick={() => gererSuppressionHabilitation(h)} style={{ marginLeft: '0.4rem' }}>🗑️</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {afficherFormulaire && (
        <form className="formulaire-carte" onSubmit={gererCreation}>
          <div className="grille-formulaire">
            <label>
              Code <input
                value={formulaire.code}
                onChange={(e) => setFormulaire({ ...formulaire, code: e.target.value.toUpperCase() })}
                placeholder="EX: LOGISTIQUE"
                required
              />
            </label>
            <label>Libellé <input value={formulaire.libelle} onChange={(e) => setFormulaire({ ...formulaire, libelle: e.target.value })} required /></label>
          </div>
          <button type="submit" disabled={envoiEnCours}>{envoiEnCours ? 'Création...' : 'Créer la fonction'}</button>
        </form>
      )}

      {chargement ? <p>Chargement...</p> : (
        <div className="grille-cartes-rapports">
          {fonctions.map((f) => (
            <div key={f.id} className="carte-rapport">
              <div className="entete-carte-rapport">
                <p className="periode-rapport">{f.libelle} <span style={{ color: '#999', fontWeight: 400 }}>({f.code})</span></p>
                {!CODES_PROTEGES.includes(f.code) && (
                  <button className="bouton-icone bouton-danger" title="Supprimer" onClick={() => gererSuppression(f)}>🗑️</button>
                )}
              </div>

              {fonctionOuverteId === f.id ? (
                <div>
                  {habilitations.map((h) => (
                    <label key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: 'auto', margin: '0.3rem 0' }}>
                      <input
                        type="checkbox"
                        style={{ width: 'auto' }}
                        checked={habilitationsChoisies.includes(h.id)}
                        onChange={() => basculerHabilitation(h.id)}
                      />
                      {h.libelle}
                    </label>
                  ))}
                  <div className="actions-ligne" style={{ marginTop: '0.6rem' }}>
                    <button disabled={envoiEnCours} onClick={() => gererEnregistrementHabilitations(f)}>{envoiEnCours ? '...' : 'Enregistrer'}</button>
                    <button type="button" onClick={() => setFonctionOuverteId(null)}>Annuler</button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="note">{f.habilitations.length === 0 ? 'Aucune habilitation.' : f.habilitations.map((h) => h.libelle).join(', ')}</p>
                  <button className="bouton-petit" onClick={() => ouvrirHabilitations(f)}>Gérer les habilitations</button>
                </div>
              )}
            </div>
          ))}
          {fonctions.length === 0 && <p className="vide">Aucune fonction pour l'instant.</p>}
        </div>
      )}
    </div>
  );
}


function OngletParametres() {
  const [parametres, setParametres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [enEditionId, setEnEditionId] = useState(null);
  const [valeurEdition, setValeurEdition] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [formulaire, setFormulaire] = useState({ cle: '', valeur: '', description: '' });

  async function charger() {
    setChargement(true);
    try {
      const donnees = await appelerApi('/parametres');
      setParametres(donnees.parametres);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { charger(); }, []);

  function ouvrirEdition(p) {
    setEnEditionId(p.id);
    setValeurEdition(p.valeur);
  }

  async function gererEnregistrementEdition(p) {
    setErreur('');
    setEnvoiEnCours(true);
    try {
      await appelerApi(`/parametres/${p.id}`, { method: 'PUT', body: { valeur: valeurEdition } });
      setEnEditionId(null);
      await charger();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  async function gererCreation(e) {
    e.preventDefault();
    setErreur('');
    setEnvoiEnCours(true);
    try {
      await appelerApi('/parametres', { method: 'POST', body: formulaire });
      setFormulaire({ cle: '', valeur: '', description: '' });
      setAfficherFormulaire(false);
      await charger();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <div>
      <div className="entete-page">
        <h2>Paramètres système</h2>
        <button onClick={() => setAfficherFormulaire(!afficherFormulaire)}>{afficherFormulaire ? 'Annuler' : '+ Nouveau paramètre'}</button>
      </div>
      <p className="note">Réglages globaux utilisés ailleurs dans l'application (ex : taux de majoration des remboursements).</p>

      {erreur && <p className="message-erreur">{erreur}</p>}

      {afficherFormulaire && (
        <form className="formulaire-carte" onSubmit={gererCreation}>
          <div className="grille-formulaire">
            <label>
              Clé <input
                value={formulaire.cle}
                onChange={(e) => setFormulaire({ ...formulaire, cle: e.target.value })}
                placeholder="ex: taux_majoration_remboursement"
                required
              />
            </label>
            <label>Valeur <input value={formulaire.valeur} onChange={(e) => setFormulaire({ ...formulaire, valeur: e.target.value })} required /></label>
            <label className="pleine-largeur">Description (optionnel) <input value={formulaire.description} onChange={(e) => setFormulaire({ ...formulaire, description: e.target.value })} /></label>
          </div>
          <button type="submit" disabled={envoiEnCours}>{envoiEnCours ? 'Création...' : 'Créer le paramètre'}</button>
        </form>
      )}

      {chargement ? <p>Chargement...</p> : (
        <table className="tableau">
          <thead><tr><th>Clé</th><th>Valeur</th><th>Description</th><th></th></tr></thead>
          <tbody>
            {parametres.map((p) => (
              <tr key={p.id}>
                <td><code>{p.cle}</code></td>
                <td>
                  {enEditionId === p.id ? (
                    <input value={valeurEdition} onChange={(e) => setValeurEdition(e.target.value)} />
                  ) : p.valeur}
                </td>
                <td>{p.description || '—'}</td>
                <td className="actions-ligne">
                  {enEditionId === p.id ? (
                    <>
                      <button disabled={envoiEnCours} onClick={() => gererEnregistrementEdition(p)}>{envoiEnCours ? '...' : 'Enregistrer'}</button>
                      <button type="button" onClick={() => setEnEditionId(null)}>Annuler</button>
                    </>
                  ) : (
                    <button className="bouton-icone" title="Modifier" onClick={() => ouvrirEdition(p)}>✏️</button>
                  )}
                </td>
              </tr>
            ))}
            {parametres.length === 0 && <tr><td colSpan="4" className="vide">Aucun paramètre pour l'instant.</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}
