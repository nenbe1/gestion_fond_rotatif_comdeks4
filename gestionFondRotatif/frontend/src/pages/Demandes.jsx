import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import appelerApi from '../api/client';

/**
 * Page Demandes de financement — consultation uniquement. Les demandes
 * sont créées, réparties et suivies par le comité côté Mobile ; la
 * Responsable/Administration ne fait ici que consulter et décider
 * (approuver/rejeter) une fois le circuit interne du comité terminé.
 *
 * CORRECTION : les demandes encore "EnCours" (comité pas fini de
 * valider) ne sont plus jamais renvoyées par l'API pour la Responsable
 * (filtré côté backend) — donc elles ne peuvent apparaître dans aucun
 * onglet ici. "Toutes les demandes" veut maintenant dire "tout
 * l'historique concernant la Responsable" (en attente + déjà décidées),
 * jamais les demandes encore en cours de circuit interne.
 */
export default function Demandes() {
  const [demandes, setDemandes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [onglet, setOnglet] = useState('attente'); // 'attente' | 'toutes'

  async function chargerDonnees() {
    setChargement(true);
    try {
      const d = await appelerApi('/demandes-financement');
      setDemandes(d.demandes);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { chargerDonnees(); }, []);

  const libelleStatut = {
    EnAttenteResponsable: 'En attente de la Responsable',
    Validee: 'Validée',
    Rejetee: 'Rejetée',
  };

  const demandesAffichees = onglet === 'attente'
    ? demandes.filter((d) => d.statutGlobal === 'EnAttenteResponsable')
    : demandes;

  return (
    <div>
      <div className="entete-page">
        <h1>Demandes de financement</h1>
      </div>

      <div className="onglets">
        <button
          className={onglet === 'attente' ? 'onglet-actif' : 'onglet'}
          onClick={() => setOnglet('attente')}
        >
          En attente de décision ({demandes.filter((d) => d.statutGlobal === 'EnAttenteResponsable').length})
        </button>
        <button
          className={onglet === 'toutes' ? 'onglet-actif' : 'onglet'}
          onClick={() => setOnglet('toutes')}
        >
          Historique ({demandes.length})
        </button>
      </div>

      {erreur && <p className="message-erreur">{erreur}</p>}

      {chargement ? (
        <p>Chargement...</p>
      ) : (
        <table className="tableau">
          <thead>
            <tr><th>Code</th><th>Canton</th><th>Objet</th><th>Montant</th><th>Statut</th><th></th></tr>
          </thead>
          <tbody>
            {demandesAffichees.map((d) => (
              <tr key={d.id}>
                <td>{d.codeDemande}</td>
                <td>{d.cantonNom || '—'}</td>
                <td>{d.objetDemande}</td>
                <td>{Number(d.montantDemande).toLocaleString('fr-FR')} FCFA</td>
                <td><span className={`badge badge-${d.statutGlobal}`}>{libelleStatut[d.statutGlobal] || d.statutGlobal}</span></td>
                <td><Link to={`/demandes/${d.id}`}>Voir le circuit →</Link></td>
              </tr>
            ))}
            {demandesAffichees.length === 0 && (
              <tr><td colSpan="6" className="vide">
                {onglet === 'attente' ? "Aucune demande en attente de votre décision." : "Aucune demande pour l'instant."}
              </td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
