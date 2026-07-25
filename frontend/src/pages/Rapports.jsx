import { useEffect, useState } from 'react';
import appelerApi from '../api/client';

/**
 * Page Rapports — génère un nouvel instantané d'indicateurs sur une
 * période, et liste les rapports déjà générés (jamais recalculés après
 * coup, voir modules/rapports côté backend).
 */
export default function Rapports() {
  const [rapports, setRapports] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [periode, setPeriode] = useState({ periode_debut: '', periode_fin: '' });
  const [generationEnCours, setGenerationEnCours] = useState(false);

  async function chargerRapports() {
    setChargement(true);
    try {
      const donnees = await appelerApi('/rapports');
      setRapports(donnees.rapports);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { chargerRapports(); }, []);

  async function gererGeneration(e) {
    e.preventDefault();
    setErreur('');
    setGenerationEnCours(true);
    try {
      await appelerApi('/rapports', { method: 'POST', body: periode });
      await chargerRapports();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setGenerationEnCours(false);
    }
  }

  return (
    <div>
      <h1>Rapports</h1>

      <form className="formulaire-carte" onSubmit={gererGeneration}>
        <div className="grille-formulaire">
          <label>
            Période — début
            <input type="date" value={periode.periode_debut}
              onChange={(e) => setPeriode({ ...periode, periode_debut: e.target.value })} required />
          </label>
          <label>
            Période — fin
            <input type="date" value={periode.periode_fin}
              onChange={(e) => setPeriode({ ...periode, periode_fin: e.target.value })} required />
          </label>
        </div>
        <button type="submit" disabled={generationEnCours}>
          {generationEnCours ? 'Génération...' : 'Générer le rapport'}
        </button>
      </form>

      {erreur && <p className="message-erreur">{erreur}</p>}

      {chargement ? <p>Chargement...</p> : (
        <div className="grille-cartes-rapports">
          {rapports.map((r) => (
            <div key={r.id} className="carte-rapport">
              <p className="periode-rapport">{r.periodeDebut} → {r.periodeFin}</p>
              <div className="indicateurs-rapport">
                <div><span>{r.nombreBeneficiaires}</span>bénéficiaires touchés</div>
                <div><span>{Number(r.montantTotalFinance).toLocaleString('fr-FR')}</span>FCFA financés</div>
                <div><span>{Number(r.montantTotalRembourse).toLocaleString('fr-FR')}</span>FCFA remboursés</div>
                <div><span>{r.tauxRemboursement}%</span>taux de remboursement</div>
                <div><span>{r.nombreRetards}</span>retards</div>
              </div>
            </div>
          ))}
          {rapports.length === 0 && <p className="vide">Aucun rapport généré pour l'instant.</p>}
        </div>
      )}
    </div>
  );
}
