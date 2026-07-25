import { useEffect, useState } from 'react';
import appelerApi from '../api/client';

/**
 * Page Bénéficiaires — liste tous les bénéficiaires et permet d'en créer
 * un nouveau (crée aussi son compte utilisateur, côté backend).
 */
export default function Beneficiaires() {
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [formulaire, setFormulaire] = useState({
    nom: '', prenom: '', sexe: 'F', telephone: '', mot_de_passe: '',
    age_estime: '', activite: '',
  });
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  async function chargerBeneficiaires() {
    setChargement(true);
    try {
      const donnees = await appelerApi('/beneficiaires');
      setBeneficiaires(donnees.beneficiaires);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { chargerBeneficiaires(); }, []);

  function gererChangement(e) {
    setFormulaire({ ...formulaire, [e.target.name]: e.target.value });
  }

  async function gererCreation(e) {
    e.preventDefault();
    setErreur('');
    setEnvoiEnCours(true);
    try {
      await appelerApi('/beneficiaires', { method: 'POST', body: formulaire });
      setAfficherFormulaire(false);
      setFormulaire({ nom: '', prenom: '', sexe: 'F', telephone: '', mot_de_passe: '', age_estime: '', activite: '' });
      await chargerBeneficiaires();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <div>
      <div className="entete-page">
        <h1>Bénéficiaires</h1>
        <button onClick={() => setAfficherFormulaire(!afficherFormulaire)}>
          {afficherFormulaire ? 'Annuler' : '+ Nouveau bénéficiaire'}
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
            <label>Mot de passe <input type="password" name="mot_de_passe" value={formulaire.mot_de_passe} onChange={gererChangement} required /></label>
            <label>Âge estimé <input type="number" name="age_estime" value={formulaire.age_estime} onChange={gererChangement} /></label>
            <label className="pleine-largeur">Activité <input name="activite" value={formulaire.activite} onChange={gererChangement} /></label>
          </div>
          <button type="submit" disabled={envoiEnCours}>{envoiEnCours ? 'Création...' : 'Créer le bénéficiaire'}</button>
        </form>
      )}

      {chargement ? (
        <p>Chargement...</p>
      ) : (
        <table className="tableau">
          <thead>
            <tr>
              <th>Nom</th><th>Prénom</th><th>Téléphone</th><th>Activité</th><th>Statut MMF</th>
            </tr>
          </thead>
          <tbody>
            {beneficiaires.map((b) => (
              <tr key={b.id}>
                <td>{b.nom}</td>
                <td>{b.prenom}</td>
                <td>{b.telephone}</td>
                <td>{b.activite || '—'}</td>
                <td><span className={`badge badge-${b.statutMMF}`}>{b.statutMMF}</span></td>
              </tr>
            ))}
            {beneficiaires.length === 0 && (
              <tr><td colSpan="5" className="vide">Aucun bénéficiaire pour l'instant.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
