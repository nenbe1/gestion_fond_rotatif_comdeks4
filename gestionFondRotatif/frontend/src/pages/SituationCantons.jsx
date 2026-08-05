import { useEffect, useState } from 'react';
import appelerApi from '../api/client';

/**
 * Vue synthétique pour la Responsable : combien chaque canton a déjà
 * remboursé au fonds (remboursements collectifs confirmés uniquement —
 * donc réellement reversés, pas juste prévus). Le détail semaine par
 * semaine et la collecte individuelle restent sur le Mobile, gérés par
 * le comité ; ici on ne voit que la synthèse par canton.
 */
export default function SituationCantons() {
  const [lignes, setLignes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    async function charger() {
      try {
        const donnees = await appelerApi('/rapports/remboursements-par-canton');
        setLignes(donnees.remboursementsParCanton);
      } catch (err) {
        setErreur(err.message);
      } finally {
        setChargement(false);
      }
    }
    charger();
  }, []);

  const totalRembourse = lignes.reduce((s, l) => s + Number(l.montantRembourse), 0);

  return (
    <div>
      <div className="entete-page">
        <h1>Situation par canton</h1>
      </div>

      {erreur && <p className="message-erreur">{erreur}</p>}

      {chargement ? (
        <p>Chargement...</p>
      ) : (
        <table className="tableau">
          <thead>
            <tr><th>Canton</th><th>Montant remboursé au fonds</th><th>Nombre de remboursements confirmés</th></tr>
          </thead>
          <tbody>
            {lignes.map((l) => (
              <tr key={l.cantonId}>
                <td>{l.cantonNom}</td>
                <td>{l.montantRembourse.toLocaleString('fr-FR')} FCFA</td>
                <td>{l.nombreRemboursements}</td>
              </tr>
            ))}
            {lignes.length === 0 && (
              <tr><td colSpan="3" className="vide">Aucun canton enregistré pour l'instant.</td></tr>
            )}
          </tbody>
          {lignes.length > 0 && (
            <tfoot>
              <tr>
                <td><strong>Total</strong></td>
                <td><strong>{totalRembourse.toLocaleString('fr-FR')} FCFA</strong></td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      )}
    </div>
  );
}
