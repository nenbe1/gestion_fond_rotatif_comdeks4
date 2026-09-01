import { useEffect, useState } from 'react';
import appelerApi from '../api/client';

/**
 * Page Remboursements en attente — les remboursements collectifs dont
 * le circuit du comité (Trésorier -> Commissaire -> Président) est
 * terminé, en attente de la décision finale de la Responsable (même
 * principe que pour les demandes de financement : le comité approuve en
 * interne, la Responsable a le dernier mot avant que l'argent ne soit
 * réellement recrédité au fonds).
 */
export default function RemboursementsAttente() {
  const [remboursements, setRemboursements] = useState([]);
  const [penalites, setPenalites] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [actionEnCoursId, setActionEnCoursId] = useState(null);

  async function charger() {
    setChargement(true);
    try {
      const [donneesRemboursements, donneesPenalites] = await Promise.all([
        appelerApi('/remboursements/collectif/en-attente-responsable'),
        appelerApi('/penalites-retard/en-attente'),
      ]);
      setRemboursements(donneesRemboursements.remboursements);
      setPenalites(donneesPenalites.penalites);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { charger(); }, []);

  async function gererDecision(r, decision) {
    if (decision === 'Rejete' && !window.confirm(`Rejeter ce remboursement de ${Number(r.montantPrevu).toLocaleString('fr-FR')} FCFA ? Le fonds ne sera pas crédité.`)) {
      return;
    }
    setErreur('');
    setActionEnCoursId(r.id);
    try {
      await appelerApi(`/remboursements/collectif/${r.id}/decision-responsable`, {
        method: 'PUT',
        body: { decision },
      });
      await charger();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setActionEnCoursId(null);
    }
  }

  async function gererDecisionPenalite(p, decision) {
    const libelle = `${p.beneficiairePrenom} ${p.beneficiaireNom}`;
    if (decision === 'Validee' && !window.confirm(`Valider cette pénalité de ${Number(p.montantPropose).toLocaleString('fr-FR')} FCFA pour ${libelle} ? Elle lui sera communiquée.`)) {
      return;
    }
    setErreur('');
    setActionEnCoursId(`penalite-${p.id}`);
    try {
      await appelerApi(`/penalites-retard/${p.id}/decision`, {
        method: 'PUT',
        body: { decision },
      });
      await charger();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setActionEnCoursId(null);
    }
  }

  return (
    <div>
      <h1>Remboursements en attente</h1>
      <p className="note">Circuit du comité terminé — reste ta décision avant que le fonds ne soit crédité.</p>

      {erreur && <p className="message-erreur">{erreur}</p>}

      {chargement ? (
        <p>Chargement...</p>
      ) : (
        <table className="tableau">
          <thead>
            <tr><th>Financement</th><th>Semaine</th><th>Date prévue</th><th>Montant</th><th></th></tr>
          </thead>
          <tbody>
            {remboursements.map((r) => (
              <tr key={r.id}>
                <td>{r.codeFinancement}</td>
                <td>Semaine {r.numeroSemaine}</td>
                <td>{new Date(r.datePrevue).toLocaleDateString('fr-FR')}</td>
                <td>{Number(r.montantPrevu).toLocaleString('fr-FR')} FCFA</td>
                <td className="actions-ligne">
                  <button
                    disabled={actionEnCoursId === r.id}
                    onClick={() => gererDecision(r, 'Approuve')}
                  >
                    {actionEnCoursId === r.id ? '...' : 'Approuver et créditer'}
                  </button>
                  <button
                    className="bouton-danger"
                    disabled={actionEnCoursId === r.id}
                    onClick={() => gererDecision(r, 'Rejete')}
                  >
                    Rejeter
                  </button>
                </td>
              </tr>
            ))}
            {remboursements.length === 0 && (
              <tr><td colSpan="5" className="vide">Aucun remboursement en attente de décision.</td></tr>
            )}
          </tbody>
        </table>
      )}

      <h2 style={{ marginTop: '2.5rem' }}>Pénalités de retard proposées</h2>
      <p className="note">Calculées automatiquement chaque jour — rien ne s'applique tant que tu n'as pas décidé, cas par cas.</p>

      {!chargement && (
        <table className="tableau">
          <thead>
            <tr><th>Bénéficiaire</th><th>Financement</th><th>Semaines de retard</th><th>Reste dû</th><th>Pénalité proposée</th><th></th></tr>
          </thead>
          <tbody>
            {penalites.map((p) => (
              <tr key={p.id}>
                <td>{p.beneficiairePrenom} {p.beneficiaireNom}</td>
                <td>{p.codeFinancement}</td>
                <td>{p.semainesRetard}</td>
                <td>{Number(p.montantRestantDu).toLocaleString('fr-FR')} FCFA</td>
                <td>{Number(p.montantPropose).toLocaleString('fr-FR')} FCFA</td>
                <td className="actions-ligne">
                  <button
                    disabled={actionEnCoursId === `penalite-${p.id}`}
                    onClick={() => gererDecisionPenalite(p, 'Validee')}
                  >
                    {actionEnCoursId === `penalite-${p.id}` ? '...' : 'Valider'}
                  </button>
                  <button
                    className="bouton-danger"
                    disabled={actionEnCoursId === `penalite-${p.id}`}
                    onClick={() => gererDecisionPenalite(p, 'Rejetee')}
                  >
                    Rejeter
                  </button>
                </td>
              </tr>
            ))}
            {penalites.length === 0 && (
              <tr><td colSpan="6" className="vide">Aucune pénalité proposée pour l'instant.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
