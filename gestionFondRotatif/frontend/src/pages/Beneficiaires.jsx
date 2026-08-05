import { useEffect, useState } from 'react';
import appelerApi from '../api/client';

/**
 * Page Bénéficiaires — consultation uniquement. Les bénéficiaires sont
 * créés exclusivement par les membres du comité, sur le Mobile, au
 * moment où ils proposent une demande de financement (jamais depuis le
 * Web) — pour garder la traçabilité de qui a enregistré qui, sur le
 * terrain.
 *
 * AJOUT : filtre par canton (la Responsable voit tous les cantons,
 * ce filtre lui permet de se concentrer sur un canton à la fois).
 *
 * CORRECTION : la liste des cantons du filtre vient maintenant de
 * l'endpoint de référence /membres-comite/reference/cantons (tous les
 * cantons existants), et non plus des seuls cantons déjà présents chez
 * les bénéficiaires chargés — sinon un canton sans bénéficiaire pour
 * l'instant (ex: Guinglaye, Mororo) n'apparaissait jamais dans le filtre.
 */
export default function Beneficiaires() {
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [cantons, setCantons] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [cantonSelectionne, setCantonSelectionne] = useState('');

  useEffect(() => {
    async function charger() {
      try {
        const [donnees, c] = await Promise.all([
          appelerApi('/beneficiaires'),
          appelerApi('/membres-comite/reference/cantons'),
        ]);
        setBeneficiaires(donnees.beneficiaires);
        setCantons(c.cantons);
      } catch (err) {
        setErreur(err.message);
      } finally {
        setChargement(false);
      }
    }
    charger();
  }, []);

  const beneficiairesAffiches = cantonSelectionne
    ? beneficiaires.filter((b) => String(b.cantonId) === String(cantonSelectionne))
    : beneficiaires;

  return (
    <div>
      <div className="entete-page">
        <h1>Bénéficiaires</h1>
        <label>
          Canton
          <select value={cantonSelectionne} onChange={(e) => setCantonSelectionne(e.target.value)}>
            <option value="">Tous les cantons</option>
            {cantons.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </label>
      </div>

      {erreur && <p className="message-erreur">{erreur}</p>}

      {chargement ? (
        <p>Chargement...</p>
      ) : (
        <table className="tableau">
          <thead>
            <tr>
              <th>Nom</th><th>Prénom</th><th>Canton</th><th>Téléphone</th><th>Âge estimé</th><th>Activité</th><th>Statut MMF</th>
            </tr>
          </thead>
          <tbody>
            {beneficiairesAffiches.map((b) => (
              <tr key={b.id}>
                <td>{b.nom}</td>
                <td>{b.prenom}</td>
                <td>{b.cantonNom || '—'}</td>
                <td>{b.telephone}</td>
                <td>{b.ageEstime ?? '—'}</td>
                <td>{b.activite || '—'}</td>
                <td><span className={`badge badge-${b.statutMMF}`}>{b.statutMMF}</span></td>
              </tr>
            ))}
            {beneficiairesAffiches.length === 0 && (
              <tr><td colSpan="7" className="vide">Aucun bénéficiaire pour ce canton.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
