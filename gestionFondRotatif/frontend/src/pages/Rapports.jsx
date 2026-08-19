import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import appelerApi, { BASE_URL } from '../api/client';

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
  const [telechargementEnCoursId, setTelechargementEnCoursId] = useState(null);
  const [telechargementExcelEnCoursId, setTelechargementExcelEnCoursId] = useState(null);
  const [detailOuvertId, setDetailOuvertId] = useState(null);
  const [detailParRapport, setDetailParRapport] = useState({}); // { [rapportId]: [...] }
  const [detailChargementId, setDetailChargementId] = useState(null);

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

  async function basculerDetail(rapport) {
    if (detailOuvertId === rapport.id) {
      setDetailOuvertId(null);
      return;
    }
    setDetailOuvertId(rapport.id);
    if (detailParRapport[rapport.id]) return; // déjà chargé, pas besoin de rappeler l'API

    setDetailChargementId(rapport.id);
    try {
      const donnees = await appelerApi(`/rapports/${rapport.id}/detail`);
      setDetailParRapport((prev) => ({ ...prev, [rapport.id]: donnees.detail }));
    } catch (err) {
      setErreur(err.message);
    } finally {
      setDetailChargementId(null);
    }
  }

  /**
   * Rapport précédent chronologiquement (le plus récent dont la période
   * se termine avant le début de celui-ci) — sert de base à la
   * comparaison affichée sur chaque carte. Basé sur les périodes
   * couvertes, pas sur l'ordre de génération (un rapport généré en
   * retard pour une ancienne période ne doit pas fausser la comparaison
   * d'un rapport plus récent).
   */
  function trouverRapportPrecedent(rapport) {
    return rapports
      .filter((r) => r.id !== rapport.id && r.periodeFin < rapport.periodeDebut)
      .sort((a, b) => (a.periodeFin < b.periodeFin ? 1 : -1))[0] || null;
  }

  function calculerEvolution(valeurActuelle, valeurPrecedente) {
    if (valeurPrecedente === 0) return null; // pas de base de comparaison sensée (division par zéro)
    const variation = ((valeurActuelle - valeurPrecedente) / valeurPrecedente) * 100;
    return Math.round(variation * 10) / 10;
  }

  function PastilleEvolution({ valeur }) {
    if (valeur === null) return null;
    const hausse = valeur > 0;
    const stable = valeur === 0;
    return (
      <span className={`pastille-evolution ${stable ? 'evolution-stable' : hausse ? 'evolution-hausse' : 'evolution-baisse'}`}>
        {stable ? '=' : hausse ? `↑ +${valeur}%` : `↓ ${valeur}%`}
      </span>
    );
  }

  /**
   * Le PDF est protégé par le token de connexion — un simple lien <a
   * href> ne suffit pas (le navigateur n'y ajouterait pas l'en-tête
   * d'autorisation). On le télécharge nous-mêmes via fetch, puis on
   * déclenche l'enregistrement navigateur à partir du contenu reçu.
   */
  async function gererTelechargementPdf(rapport) {
    setErreur('');
    setTelechargementEnCoursId(rapport.id);
    try {
      const token = localStorage.getItem('token');
      const reponse = await fetch(`${BASE_URL}/rapports/${rapport.id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!reponse.ok) throw new Error('Impossible de générer le PDF.');

      const blob = await reponse.blob();
      const url = window.URL.createObjectURL(blob);
      const lien = document.createElement('a');
      lien.href = url;
      lien.download = `rapport_${rapport.periodeDebut}_${rapport.periodeFin}.pdf`;
      document.body.appendChild(lien);
      lien.click();
      lien.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setTelechargementEnCoursId(null);
    }
  }

  /** Même principe que gererTelechargementPdf ci-dessus, pour le format Excel (module 6 du cahier des charges). */
  async function gererTelechargementExcel(rapport) {
    setErreur('');
    setTelechargementExcelEnCoursId(rapport.id);
    try {
      const token = localStorage.getItem('token');
      const reponse = await fetch(`${BASE_URL}/rapports/${rapport.id}/excel`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!reponse.ok) throw new Error('Impossible de générer le fichier Excel.');

      const blob = await reponse.blob();
      const url = window.URL.createObjectURL(blob);
      const lien = document.createElement('a');
      lien.href = url;
      lien.download = `rapport_${rapport.periodeDebut}_${rapport.periodeFin}.xlsx`;
      document.body.appendChild(lien);
      lien.click();
      lien.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setTelechargementExcelEnCoursId(null);
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

      <p className="note">
        Pour la répartition des remboursements par canton, voir <Link to="/situation-cantons">Situation par canton</Link>.
      </p>

      <h2 className="titre-section-rapport">Rapports par période</h2>

      {chargement ? <p>Chargement...</p> : (
        <div className="grille-cartes-rapports">
          {rapports.map((r) => {
            const precedent = trouverRapportPrecedent(r);
            return (
            <div key={r.id} className="carte-rapport">
              <div className="entete-carte-rapport">
                <p className="periode-rapport">{r.periodeDebut} → {r.periodeFin}</p>
                <div className="actions-ligne">
                  <button
                    className="bouton-icone"
                    title="Détail nominatif"
                    onClick={() => basculerDetail(r)}
                  >
                    {detailChargementId === r.id ? '...' : '🔍'}
                  </button>
                  <button
                    className="bouton-icone"
                    title="Télécharger en PDF"
                    disabled={telechargementEnCoursId === r.id}
                    onClick={() => gererTelechargementPdf(r)}
                  >
                    {telechargementEnCoursId === r.id ? '...' : '📄'}
                  </button>
                  <button
                    className="bouton-icone"
                    title="Télécharger en Excel"
                    disabled={telechargementExcelEnCoursId === r.id}
                    onClick={() => gererTelechargementExcel(r)}
                  >
                    {telechargementExcelEnCoursId === r.id ? '...' : '📊'}
                  </button>
                  <button
                    className="bouton-icone bouton-danger"
                    title="Supprimer"
                    disabled={suppressionEnCoursId === r.id}
                    onClick={() => gererSuppression(r.id)}
                  >
                    {suppressionEnCoursId === r.id ? '...' : '🗑️'}
                  </button>
                </div>
              </div>
              <div className="indicateurs-rapport">
                <div>
                  <span>{r.nombreBeneficiaires}</span>bénéficiaires touchés
                  {precedent && <PastilleEvolution valeur={calculerEvolution(r.nombreBeneficiaires, precedent.nombreBeneficiaires)} />}
                </div>
                <div>
                  <span>{Number(r.montantTotalFinance).toLocaleString('fr-FR')}</span>FCFA financés
                  {precedent && <PastilleEvolution valeur={calculerEvolution(r.montantTotalFinance, precedent.montantTotalFinance)} />}
                </div>
                <div>
                  <span>{Number(r.montantTotalRembourse).toLocaleString('fr-FR')}</span>FCFA remboursés
                  {precedent && <PastilleEvolution valeur={calculerEvolution(r.montantTotalRembourse, precedent.montantTotalRembourse)} />}
                </div>
                <div>
                  <span>{r.tauxRemboursement}%</span>taux de remboursement
                  {precedent && <PastilleEvolution valeur={calculerEvolution(r.tauxRemboursement, precedent.tauxRemboursement)} />}
                </div>
                <div>
                  <span>{r.nombreRetards}</span>retards
                  {precedent && <PastilleEvolution valeur={calculerEvolution(r.nombreRetards, precedent.nombreRetards)} />}
                </div>
              </div>
              {precedent && (
                <p className="note-comparaison">vs période {precedent.periodeDebut} → {precedent.periodeFin}</p>
              )}

              {detailOuvertId === r.id && (
                <div className="detail-nominatif">
                  {detailChargementId === r.id ? (
                    <p>Chargement du détail...</p>
                  ) : (detailParRapport[r.id]?.length ?? 0) === 0 ? (
                    <p className="vide">Aucun financement attribué sur cette période.</p>
                  ) : (
                    <table className="tableau">
                      <thead><tr><th>Bénéficiaire</th><th>Financement</th><th>Canton</th><th>Montant</th><th>Date</th></tr></thead>
                      <tbody>
                        {detailParRapport[r.id].map((d, i) => (
                          <tr key={i}>
                            <td>{d.beneficiaireNom} {d.beneficiairePrenom}</td>
                            <td>{d.codeFinancement}</td>
                            <td>{d.cantonNom}</td>
                            <td>{d.montantAttribue.toLocaleString('fr-FR')} FCFA</td>
                            <td>{new Date(d.dateAttribution).toLocaleDateString('fr-FR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
            );
          })}
          {rapports.length === 0 && <p className="vide">Aucun rapport généré pour l'instant.</p>}
        </div>
      )}
    </div>
  );
}
