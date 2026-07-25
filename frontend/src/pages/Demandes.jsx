import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import appelerApi from '../api/client';

/**
 * Page Demandes de financement — liste toutes les demandes avec leur
 * statut, et permet d'en créer une nouvelle (déclenche automatiquement
 * le circuit de validation à 3 niveaux côté backend).
 */
export default function Demandes() {
  const [demandes, setDemandes] = useState([]);
  const [membres, setMembres] = useState([]);
  const [vagues, setVagues] = useState([]);
  const [domaines, setDomaines] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [formulaire, setFormulaire] = useState({
    membre_comite_id: '', vague_id: '', domaine_id: '', objet_demande: '',
    montant_demande: '', nb_femmes_benef: 0, nb_hommes_benef: 0,
  });
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  async function chargerDonnees() {
    setChargement(true);
    try {
      const [d, m, v, dom] = await Promise.all([
        appelerApi('/demandes-financement'),
        appelerApi('/membres-comite'),
        appelerApi('/vagues'),
        appelerApi('/domaines'),
      ]);
      setDemandes(d.demandes);
      setMembres(m.membres);
      setVagues(v.vagues);
      setDomaines(dom.domaines);
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
      await appelerApi('/demandes-financement', { method: 'POST', body: formulaire });
      setAfficherFormulaire(false);
      await chargerDonnees();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  const libelleStatut = {
    EnCours: 'En cours (comité)',
    EnAttenteResponsable: 'En attente de la Responsable',
    Validee: 'Validée',
    Rejetee: 'Rejetée',
  };

  return (
    <div>
      <div className="entete-page">
        <h1>Demandes de financement</h1>
        <button onClick={() => setAfficherFormulaire(!afficherFormulaire)}>
          {afficherFormulaire ? 'Annuler' : '+ Nouvelle demande'}
        </button>
      </div>

      {erreur && <p className="message-erreur">{erreur}</p>}

      {afficherFormulaire && (
        <form className="formulaire-carte" onSubmit={gererCreation}>
          <div className="grille-formulaire">
            <label>
              Membre du comité (trésorier)
              <select name="membre_comite_id" value={formulaire.membre_comite_id} onChange={gererChangement} required>
                <option value="">-- Choisir --</option>
                {membres.map((m) => <option key={m.id} value={m.id}>{m.nom} {m.prenom} ({m.fonctionLibelle})</option>)}
              </select>
            </label>
            <label>
              Vague
              <select name="vague_id" value={formulaire.vague_id} onChange={gererChangement} required>
                <option value="">-- Choisir --</option>
                {vagues.map((v) => <option key={v.id} value={v.id}>{v.nom}</option>)}
              </select>
            </label>
            <label>
              Domaine
              <select name="domaine_id" value={formulaire.domaine_id} onChange={gererChangement} required>
                <option value="">-- Choisir --</option>
                {domaines.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
              </select>
            </label>
            <label>Montant demandé (FCFA) <input type="number" name="montant_demande" value={formulaire.montant_demande} onChange={gererChangement} required /></label>
            <label>Nb femmes bénéficiaires <input type="number" name="nb_femmes_benef" value={formulaire.nb_femmes_benef} onChange={gererChangement} /></label>
            <label>Nb hommes bénéficiaires <input type="number" name="nb_hommes_benef" value={formulaire.nb_hommes_benef} onChange={gererChangement} /></label>
            <label className="pleine-largeur">
              Objet de la demande
              <textarea name="objet_demande" value={formulaire.objet_demande} onChange={gererChangement} required />
            </label>
          </div>
          <button type="submit" disabled={envoiEnCours}>{envoiEnCours ? 'Création...' : 'Créer la demande'}</button>
        </form>
      )}

      {chargement ? (
        <p>Chargement...</p>
      ) : (
        <table className="tableau">
          <thead>
            <tr><th>Code</th><th>Objet</th><th>Montant</th><th>Statut</th><th></th></tr>
          </thead>
          <tbody>
            {demandes.map((d) => (
              <tr key={d.id}>
                <td>{d.codeDemande}</td>
                <td>{d.objetDemande}</td>
                <td>{Number(d.montantDemande).toLocaleString('fr-FR')} FCFA</td>
                <td><span className={`badge badge-${d.statutGlobal}`}>{libelleStatut[d.statutGlobal] || d.statutGlobal}</span></td>
                <td><Link to={`/demandes/${d.id}`}>Voir le circuit →</Link></td>
              </tr>
            ))}
            {demandes.length === 0 && (
              <tr><td colSpan="5" className="vide">Aucune demande pour l'instant.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
