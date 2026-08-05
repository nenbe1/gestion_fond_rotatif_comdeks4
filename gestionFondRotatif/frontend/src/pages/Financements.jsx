import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import appelerApi from '../api/client';

/**
 * Page Financements — liste tous les décaissements effectués (créés
 * automatiquement une fois une demande approuvée par la Responsable).
 * Point d'entrée vers la répartition aux bénéficiaires et le suivi des
 * remboursements (répartition/remboursement gérés par le comité, sur
 * Mobile — voir DetailFinancement.jsx qui est en lecture seule ici).
 *
 * CORRECTION : "Modifier" couvre maintenant programme, fonds source ET
 * montant (avant, seul le programme l'était). Le montant/fonds restent
 * bloqués côté backend si des bénéficiaires ont déjà reçu une répartition
 * sur ce financement (409 avec message clair) — dans ce cas, seul le
 * programme est réellement pris en compte.
 * "Supprimer" reste possible uniquement sans répartition ; recrédite
 * automatiquement le fonds et remet la demande en attente de décision.
 */
export default function Financements() {
  const [financements, setFinancements] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [fonds, setFonds] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  const [financementEnEditionId, setFinancementEnEditionId] = useState(null);
  const [formulaireEdition, setFormulaireEdition] = useState({ programme_id: '', fond_rotatif_id: '', montant_financement: '' });
  const [envoiEditionEnCours, setEnvoiEditionEnCours] = useState(false);
  const [suppressionEnCoursId, setSuppressionEnCoursId] = useState(null);

  async function chargerTout() {
    setChargement(true);
    try {
      const [f, p, fo] = await Promise.all([
        appelerApi('/financements'),
        appelerApi('/programmes'),
        appelerApi('/fond-rotatif'),
      ]);
      setFinancements(f.financements);
      setProgrammes(p.programmes);
      setFonds(fo.fonds);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { chargerTout(); }, []);

  function ouvrirEdition(f) {
    setFinancementEnEditionId(f.id);
    setFormulaireEdition({
      programme_id: f.programmeId,
      fond_rotatif_id: f.fondRotatifId,
      montant_financement: f.montantFinancement,
    });
  }

  async function gererEnregistrementEdition(f) {
    setErreur('');
    setEnvoiEditionEnCours(true);
    try {
      await appelerApi(`/financements/${f.id}`, {
        method: 'PUT',
        body: formulaireEdition,
      });
      setFinancementEnEditionId(null);
      await chargerTout();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiEditionEnCours(false);
    }
  }

  async function gererSuppression(f) {
    if (!window.confirm(
      `Supprimer le financement ${f.codeFinancement} ? Le fonds sera recrédité de ${Number(f.montantFinancement).toLocaleString('fr-FR')} FCFA et la demande repassera en attente de décision. Cette action est irréversible.`
    )) return;

    setErreur('');
    setSuppressionEnCoursId(f.id);
    try {
      await appelerApi(`/financements/${f.id}`, { method: 'DELETE' });
      await chargerTout();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setSuppressionEnCoursId(null);
    }
  }

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
                {financementEnEditionId === f.id ? (
                  <>
                    <td>{f.codeFinancement}</td>
                    <td>
                      <input
                        type="number"
                        value={formulaireEdition.montant_financement}
                        onChange={(e) => setFormulaireEdition({ ...formulaireEdition, montant_financement: e.target.value })}
                      />
                    </td>
                    <td>
                      <select
                        value={formulaireEdition.programme_id}
                        onChange={(e) => setFormulaireEdition({ ...formulaireEdition, programme_id: e.target.value })}
                      >
                        {programmes.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
                      </select>
                    </td>
                    <td>
                      <select
                        value={formulaireEdition.fond_rotatif_id}
                        onChange={(e) => setFormulaireEdition({ ...formulaireEdition, fond_rotatif_id: e.target.value })}
                      >
                        {fonds.map((fd) => <option key={fd.id} value={fd.id}>{fd.libelleFond}</option>)}
                      </select>
                    </td>
                    <td><span className={`badge badge-${f.statut}`}>{f.statut}</span></td>
                    <td className="actions-ligne">
                      <button disabled={envoiEditionEnCours} onClick={() => gererEnregistrementEdition(f)}>
                        {envoiEditionEnCours ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                      <button type="button" onClick={() => setFinancementEnEditionId(null)}>Annuler</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{f.codeFinancement}</td>
                    <td>{Number(f.montantFinancement).toLocaleString('fr-FR')} FCFA</td>
                    <td>{f.programmeNom}</td>
                    <td>{f.fondLibelle}</td>
                    <td><span className={`badge badge-${f.statut}`}>{f.statut}</span></td>
                    <td className="actions-ligne">
                      <Link to={`/financements/${f.id}`}>Gérer →</Link>
                      <button className="bouton-petit" onClick={() => ouvrirEdition(f)}>Modifier</button>
                      <button
                        className="bouton-danger bouton-petit"
                        disabled={suppressionEnCoursId === f.id}
                        onClick={() => gererSuppression(f)}
                      >
                        {suppressionEnCoursId === f.id ? 'Suppression...' : 'Supprimer'}
                      </button>
                    </td>
                  </>
                )}
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
