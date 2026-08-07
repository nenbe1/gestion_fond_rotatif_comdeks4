import { useEffect, useState } from 'react';
import appelerApi from '../api/client';

/**
 * Page Remboursements en attente — Responsable uniquement. Le circuit
 * interne du comité (Trésorier -> Commissaire -> Président) a déjà
 * approuvé ces remboursements collectifs ; la décision finale (et le
 * crédit réel du fonds) revient à la Responsable, comme pour les
 * demandes de financement.
 */
export default function RemboursementsAttente() {
  const [remboursements, setRemboursements] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [actionEnCoursId, setActionEnCoursId] = useState(null);

  async function charger() {
    setChargement(true);
    try {
      const donnees = await appelerApi('/remboursements/collectif/en-attente-responsable');
      setRemboursements(donnees.remboursements);
      setErreur('');
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { charger(); }, []);

  async function gererDecision(id, decision) {
    setActionEnCoursId(id);
    setErreur('');
    try {
      await appelerApi(`/remboursements/collectif/${id}/decision-responsable`, {
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
      <div className="entete-page">
        <h1>Remboursements en attente de décision</h1>
      </div>

      {erreur && <p className="message-erreur">{erreur}</p>}

      {chargement ? (
        <p>Chargement...</p>
      ) : (
        <table className="tableau">
          <thead>
            <tr><th>Financement</th><th>Semaine</th><th>Montant prévu</th><th></th></tr>
          </thead>
          <tbody>
            {remboursements.map((r) => (
              <tr key={r.id}>
                <td>{r.codeFinancement}</td>
                <td>Semaine {r.numeroSemaine}</td>
                <td>{Number(r.montantPrevu).toLocaleString('fr-FR')} FCFA</td>
                <td>
                  <div className="actions-etape">
                    <button
                      disabled={actionEnCoursId === r.id}
                      onClick={() => gererDecision(r.id, 'Approuve')}
                    >
                      Confirmer et créditer le fonds
                    </button>
                    <button
                      className="bouton-danger"
                      disabled={actionEnCoursId === r.id}
                      onClick={() => gererDecision(r.id, 'Rejete')}
                    >
                      Rejeter
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {remboursements.length === 0 && (
              <tr><td colSpan="4" className="vide">Aucun remboursement en attente de votre décision pour l'instant.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
