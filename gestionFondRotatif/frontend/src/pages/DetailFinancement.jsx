import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import appelerApi from '../api/client';

/**
 * Page détail d'un financement — répartition aux bénéficiaires
 * (AttributionFinancement) et suivi des remboursements individuels.
 * Le "reste à payer" par bénéficiaire est recalculé après chaque
 * remboursement (recalcul du statutMMF déclenché côté backend).
 */
export default function DetailFinancement() {
  const { id } = useParams();
  const [financement, setFinancement] = useState(null);
  const [attributions, setAttributions] = useState([]);
  const [restes, setRestes] = useState({}); // { attributionId: { montantAttribue, montantRembourse, resteAPayer, soldee } }
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  const [afficherFormAttribution, setAfficherFormAttribution] = useState(false);
  const [formAttribution, setFormAttribution] = useState({ beneficiaire_id: '', montant_attribue: '' });
  const [envoiAttribution, setEnvoiAttribution] = useState(false);

  const [formulaireRemboursement, setFormulaireRemboursement] = useState(null); // attributionId en cours d'edition
  const [montantRemboursement, setMontantRemboursement] = useState('');
  const [envoiRemboursement, setEnvoiRemboursement] = useState(false);

  async function chargerTout() {
    setChargement(true);
    try {
      const [f, a, b] = await Promise.all([
        appelerApi(`/financements/${id}`),
        appelerApi(`/attributions/financement/${id}`),
        appelerApi('/beneficiaires'),
      ]);
      setFinancement(f.financement);
      setAttributions(a.attributions);
      setBeneficiaires(b.beneficiaires);

      const restesCharges = {};
      await Promise.all(
        a.attributions.map(async (attr) => {
          const r = await appelerApi(`/attributions/${attr.id}/reste-a-payer`);
          restesCharges[attr.id] = r;
        })
      );
      setRestes(restesCharges);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { chargerTout(); }, [id]);

  const montantDejaAttribue = attributions.reduce((total, a) => total + Number(a.montantAttribue), 0);
  const montantRestantAAttribuer = financement ? Number(financement.montantFinancement) - montantDejaAttribue : 0;

  async function gererCreationAttribution(e) {
    e.preventDefault();
    setErreur('');
    setEnvoiAttribution(true);
    try {
      await appelerApi('/attributions', {
        method: 'POST',
        body: { financement_id: id, ...formAttribution },
      });
      setAfficherFormAttribution(false);
      setFormAttribution({ beneficiaire_id: '', montant_attribue: '' });
      await chargerTout();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiAttribution(false);
    }
  }

  async function gererCreationRemboursement(e, attributionId) {
    e.preventDefault();
    setErreur('');
    setEnvoiRemboursement(true);
    try {
      await appelerApi('/remboursements/individuel', {
        method: 'POST',
        body: {
          attribution_financement_id: attributionId,
          montant: montantRemboursement,
          date_versement: new Date().toISOString().slice(0, 10),
        },
      });
      setFormulaireRemboursement(null);
      setMontantRemboursement('');
      await chargerTout();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiRemboursement(false);
    }
  }

  if (chargement) return <p>Chargement...</p>;
  if (!financement) return <p>Financement introuvable.</p>;

  return (
    <div>
      <h1>Financement {financement.codeFinancement}</h1>

      <div className="carte-info">
        <p><strong>Montant total :</strong> {Number(financement.montantFinancement).toLocaleString('fr-FR')} FCFA</p>
        <p><strong>Programme :</strong> {financement.programmeNom}</p>
        <p><strong>Fonds :</strong> {financement.fondLibelle}</p>
        <p><strong>Reste à attribuer :</strong> {montantRestantAAttribuer.toLocaleString('fr-FR')} FCFA</p>
      </div>

      {erreur && <p className="message-erreur">{erreur}</p>}

      <div className="entete-page">
        <h2>Répartition aux bénéficiaires</h2>
        <button
          onClick={() => setAfficherFormAttribution(!afficherFormAttribution)}
          disabled={montantRestantAAttribuer <= 0}
        >
          {afficherFormAttribution ? 'Annuler' : '+ Attribuer une part'}
        </button>
      </div>

      {afficherFormAttribution && (
        <form className="formulaire-carte" onSubmit={gererCreationAttribution}>
          <div className="grille-formulaire">
            <label>
              Bénéficiaire
              <select
                value={formAttribution.beneficiaire_id}
                onChange={(e) => setFormAttribution({ ...formAttribution, beneficiaire_id: e.target.value })}
                required
              >
                <option value="">-- Choisir --</option>
                {beneficiaires.map((b) => <option key={b.id} value={b.id}>{b.nom} {b.prenom}</option>)}
              </select>
            </label>
            <label>
              Montant attribué (FCFA)
              <input
                type="number"
                max={montantRestantAAttribuer}
                value={formAttribution.montant_attribue}
                onChange={(e) => setFormAttribution({ ...formAttribution, montant_attribue: e.target.value })}
                required
              />
            </label>
          </div>
          <button type="submit" disabled={envoiAttribution}>{envoiAttribution ? 'Enregistrement...' : 'Attribuer'}</button>
        </form>
      )}

      <table className="tableau">
        <thead>
          <tr><th>Bénéficiaire</th><th>Montant attribué</th><th>Remboursé</th><th>Reste à payer</th><th></th></tr>
        </thead>
        <tbody>
          {attributions.map((a) => {
            const reste = restes[a.id];
            return (
              <tr key={a.id}>
                <td>{a.beneficiaireNom} {a.beneficiairePrenom}</td>
                <td>{Number(a.montantAttribue).toLocaleString('fr-FR')} FCFA</td>
                <td>{reste ? reste.montantRembourse.toLocaleString('fr-FR') : '...'} FCFA</td>
                <td>
                  {reste?.soldee
                    ? <span className="badge badge-Solde">Soldé</span>
                    : `${reste ? reste.resteAPayer.toLocaleString('fr-FR') : '...'} FCFA`}
                </td>
                <td>
                  {!reste?.soldee && (
                    formulaireRemboursement === a.id ? (
                      <form className="ligne-remboursement" onSubmit={(e) => gererCreationRemboursement(e, a.id)}>
                        <input
                          type="number"
                          placeholder="Montant"
                          max={reste?.resteAPayer}
                          value={montantRemboursement}
                          onChange={(e) => setMontantRemboursement(e.target.value)}
                          required
                        />
                        <button type="submit" disabled={envoiRemboursement}>Valider</button>
                        <button type="button" onClick={() => setFormulaireRemboursement(null)}>×</button>
                      </form>
                    ) : (
                      <button onClick={() => setFormulaireRemboursement(a.id)}>+ Remboursement</button>
                    )
                  )}
                </td>
              </tr>
            );
          })}
          {attributions.length === 0 && (
            <tr><td colSpan="5" className="vide">Aucune attribution pour l'instant.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
