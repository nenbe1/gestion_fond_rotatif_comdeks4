import { useEffect, useState } from 'react';
import appelerApi from '../api/client';

/**
 * Page Rapports — génère un nouvel instantané d'indicateurs sur une
 * période, et liste les rapports déjà générés (jamais recalculés après
 * coup, voir modules/rapports côté backend).
 *
 * AJOUT : bouton Supprimer par rapport (avec confirmation), pour
 * corriger un rapport généré par erreur.
 */
export default function Rapports() {
  const [rapports, setRapports] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [periode, setPeriode] = useState({ periode_debut: '', periode_fin: '' });
  const [generationEnCours, setGenerationEnCours] = useState(false);
  const [suppressionEnCoursId, setSuppressionEnCoursId] = useState(null);
  const [remboursementsParCanton, setRemboursementsParCanton] = useState([]);
  const [chargementCantons, setChargementCantons] = useState(true);

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

  async function chargerRemboursementsParCanton() {
    setChargementCantons(true);
    try {
      const donnees = await appelerApi('/rapports/remboursements-par-canton');
      setRemboursementsParCanton(donnees.remboursementsParCanton);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargementCantons(false);
    }
  }

  useEffect(() => { chargerRapports(); chargerRemboursementsParCanton(); }, []);

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

  async function gererSuppression(id) {
    if (!window.confirm('Supprimer définitivement ce rapport ? Cette action est irréversible.')) return;
    setErreur('');
    setSuppressionEnCoursId(id);
    try {
      await appelerApi(`/rapports/${id}`, { method: 'DELETE' });
      await chargerRapports();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setSuppressionEnCoursId(null);
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

      <h2 className="titre-section-rapport">Répartition par canton</h2>
      <p className="note">Remboursements collectifs confirmés, toutes périodes confondues.</p>
      {chargementCantons ? <p>Chargement...</p> : (
        <table className="tableau" style={{ marginBottom: '2rem' }}>
          <thead><tr><th>Canton</th><th>Montant remboursé</th><th>Nombre de remboursements</th></tr></thead>
          <tbody>
            {remboursementsParCanton.map((c) => (
              <tr key={c.cantonId}>
                <td>{c.cantonNom}</td>
                <td>{c.montantRembourse.toLocaleString('fr-FR')} FCFA</td>
                <td>{c.nombreRemboursements}</td>
              </tr>
            ))}
            {remboursementsParCanton.length === 0 && (
              <tr><td colSpan="3" className="vide">Aucune donnée pour l'instant.</td></tr>
            )}
          </tbody>
        </table>
      )}

      <h2 className="titre-section-rapport">Rapports par période</h2>

      {chargement ? <p>Chargement...</p> : (
        <div className="grille-cartes-rapports">
          {rapports.map((r) => (
            <div key={r.id} className="carte-rapport">
              <div className="entete-carte-rapport">
                <p className="periode-rapport">{r.periodeDebut} → {r.periodeFin}</p>
                <button
                  className="bouton-icone bouton-danger"
                  title="Supprimer"
                  disabled={suppressionEnCoursId === r.id}
                  onClick={() => gererSuppression(r.id)}
                >
                  {suppressionEnCoursId === r.id ? '...' : '🗑️'}
                </button>
              </div>
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
