import { useEffect, useState } from 'react';
import appelerApi, { BASE_URL } from '../api/client';

const LIBELLE_ROLE = {
  RESPONSABLE: 'Responsable',
  MEMBRE_COMITE: 'Membre du comité',
  AUTORITE: 'Autorité',
  BENEFICIAIRE: 'Bénéficiaire',
};

/**
 * Page Administration — vue d'ensemble de TOUS les comptes, tous rôles
 * confondus (permissions "simples" : chaque rôle garde ses règles déjà
 * codées dans ses propres routes backend, cette page ne fait que les
 * lister ensemble). Permet aussi de télécharger une sauvegarde manuelle
 * de la base de données.
 *
 * Le (dés)activation d'un compte se fait toujours depuis sa page dédiée
 * (Membres du comité / Autorités / Bénéficiaires) — cette vue est en
 * lecture seule, elle sert à avoir une vision globale rapide.
 */
export default function Administration() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [filtreRole, setFiltreRole] = useState('');
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);

  useEffect(() => {
    async function charger() {
      try {
        const donnees = await appelerApi('/administration/utilisateurs');
        setUtilisateurs(donnees.utilisateurs);
      } catch (err) {
        setErreur(err.message);
      } finally {
        setChargement(false);
      }
    }
    charger();
  }, []);

  const utilisateursAffiches = filtreRole
    ? utilisateurs.filter((u) => u.role === filtreRole)
    : utilisateurs;

  async function gererTelechargementSauvegarde() {
    setErreur('');
    setSauvegardeEnCours(true);
    try {
      const token = localStorage.getItem('token');
      const reponse = await fetch(`${BASE_URL}/administration/sauvegarde`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!reponse.ok) {
        const donnees = await reponse.json().catch(() => ({}));
        throw new Error(donnees.message || 'Échec du téléchargement de la sauvegarde.');
      }
      const blob = await reponse.blob();
      const url = window.URL.createObjectURL(blob);
      const lien = document.createElement('a');
      const horodatage = new Date().toISOString().replace(/[:.]/g, '-');
      lien.href = url;
      lien.download = `sauvegarde_${horodatage}.sql`;
      document.body.appendChild(lien);
      lien.click();
      lien.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setSauvegardeEnCours(false);
    }
  }

  return (
    <div>
      <div className="entete-page">
        <h1>Administration</h1>
        <button onClick={gererTelechargementSauvegarde} disabled={sauvegardeEnCours}>
          {sauvegardeEnCours ? 'Génération...' : '⬇️ Télécharger une sauvegarde'}
        </button>
      </div>

      {erreur && <p className="message-erreur">{erreur}</p>}

      <label>
        Filtrer par rôle
        <select value={filtreRole} onChange={(e) => setFiltreRole(e.target.value)}>
          <option value="">Tous les rôles</option>
          {Object.entries(LIBELLE_ROLE).map(([valeur, libelle]) => (
            <option key={valeur} value={valeur}>{libelle}</option>
          ))}
        </select>
      </label>

      {chargement ? (
        <p>Chargement...</p>
      ) : (
        <table className="tableau">
          <thead>
            <tr><th>Nom</th><th>Prénom</th><th>Rôle</th><th>Téléphone</th><th>Actif</th></tr>
          </thead>
          <tbody>
            {utilisateursAffiches.map((u) => (
              <tr key={`${u.role}-${u.id}`}>
                <td>{u.nom}</td>
                <td>{u.prenom}</td>
                <td>{LIBELLE_ROLE[u.role] || u.role}</td>
                <td>{u.telephone}</td>
                <td>{u.actif ? '✅' : '❌'}</td>
              </tr>
            ))}
            {utilisateursAffiches.length === 0 && (
              <tr><td colSpan="5" className="vide">Aucun compte pour ce filtre.</td></tr>
            )}
          </tbody>
        </table>
      )}

      <p className="note" style={{ marginTop: '1rem' }}>
        Pour activer/désactiver ou modifier un compte, rends-toi sur sa page dédiée
        (Membres du comité, Autorités ou Bénéficiaires).
      </p>
    </div>
  );
}
