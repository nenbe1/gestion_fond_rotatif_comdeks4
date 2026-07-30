import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import appelerApi from '../api/client';

/**
 * Page Financements — liste tous les décaissements effectués (créés
 * automatiquement une fois une demande approuvée par la Responsable).
 * Point d'entrée vers la répartition aux bénéficiaires et le suivi des
 * remboursements.
 */
export default function Financements() {
  const [financements, setFinancements] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    async function charger() {
      try {
        const donnees = await appelerApi('/financements');
        setFinancements(donnees.financements);
      } catch (err) {
        setErreur(err.message);
      } finally {
        setChargement(false);
      }
    }
    charger();
  }, []);

  return (
    <div>
      <h1>Financements</h1>

      {erreur && <p className="message-erreur">{erreur}</p>}

      {chargement ? (
        <p>Chargement...</p>
      ) : (
        <table className="tableau">
          <thead>
            <tr><th>Code</th><th>Montant</th><th>Programme</th><th>Fonds</th><th>Statut</th><th></th></tr>
          </thead>
          <tbody>
            {financements.map((f) => (
              <tr key={f.id}>
                <td>{f.codeFinancement}</td>
                <td>{Number(f.montantFinancement).toLocaleString('fr-FR')} FCFA</td>
                <td>{f.programmeNom}</td>
                <td>{f.fondLibelle}</td>
                <td><span className={`badge badge-${f.statut}`}>{f.statut}</span></td>
                <td><Link to={`/financements/${f.id}`}>Gérer →</Link></td>
              </tr>
            ))}
            {financements.length === 0 && (
              <tr><td colSpan="6" className="vide">Aucun financement pour l'instant.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
