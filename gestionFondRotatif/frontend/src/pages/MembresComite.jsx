import { useEffect, useState } from 'react';
import appelerApi from '../api/client';

/**
 * Page Membres du comité — liste tous les membres et permet d'en créer
 * un nouveau (crée aussi son compte utilisateur, comme pour les
 * bénéficiaires). Nécessaire pour ne plus dépendre de Postman/SQL pour
 * créer un trésorier, un commissaire, un président de comité, etc.
 */
export default function MembresComite() {
  const [membres, setMembres] = useState([]);
  const [fonctions, setFonctions] = useState([]);
  const [cantons, setCantons] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [formulaire, setFormulaire] = useState({
    nom: '', prenom: '', sexe: 'M', telephone: '', mot_de_passe: '',
    fonction_id: '', canton_id: '',
  });
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

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
      setFormulaire({ nom: '', prenom: '', sexe: 'M', telephone: '', mot_de_passe: '', fonction_id: '', canton_id: '' });
      await chargerDonnees();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiEnCours(false);
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
            <label>Mot de passe <input type="password" name="mot_de_passe" value={formulaire.mot_de_passe} onChange={gererChangement} required /></label>
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
              <th>Nom</th><th>Prénom</th><th>Fonction</th><th>Canton</th><th>Téléphone</th><th>Actif</th>
            </tr>
          </thead>
          <tbody>
            {membres.map((m) => (
              <tr key={m.id}>
                <td>{m.nom}</td>
                <td>{m.prenom}</td>
                <td>{m.fonctionLibelle}</td>
                <td>{m.cantonNom}</td>
                <td>{m.telephone}</td>
                <td>{m.actif ? '✅' : '❌'}</td>
              </tr>
            ))}
            {membres.length === 0 && (
              <tr><td colSpan="6" className="vide">Aucun membre du comité pour l'instant.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
