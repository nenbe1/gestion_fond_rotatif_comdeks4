import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import appelerApi from '../api/client';

/**
 * Page détail d'un financement — LECTURE SEULE côté Web.
 *
 * CORRECTION : la répartition aux bénéficiaires (attributions) et
 * l'enregistrement des remboursements sont désormais réservés au
 * comité (déjà imposé côté backend par le middleware reserverAuComite,
 * et déjà géré sur Mobile via DetailFinancementComiteScreen /
 * DetailFinancementRemboursementsScreen). La Responsable ne fait que
 * suivre l'avancement ici — les formulaires d'action ont été retirés
 * pour ne plus afficher de boutons qui échouaient de toute façon avec
 * une erreur 403.
 */
export default function DetailFinancement() {
  const { id } = useParams();
  const [financement, setFinancement] = useState(null);
  const [attributions, setAttributions] = useState([]);
  const [restes, setRestes] = useState({}); // { attributionId: { montantAttribue, montantRembourse, resteAPayer, soldee } }
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  async function chargerTout() {
    setChargement(true);
    try {
      const [f, a] = await Promise.all([
        appelerApi(`/financements/${id}`),
        appelerApi(`/attributions/financement/${id}`),
      ]);
      setFinancement(f.financement);
      setAttributions(a.attributions);

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

      <h2>Répartition aux bénéficiaires</h2>
      <p className="note">Effectuée par le comité, sur le Mobile.</p>

      <table className="tableau">
        <thead>
          <tr><th>Bénéficiaire</th><th>Montant attribué</th><th>Remboursé</th><th>Reste à payer</th></tr>
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
              </tr>
            );
          })}
          {attributions.length === 0 && (
            <tr><td colSpan="4" className="vide">Aucune attribution pour l'instant.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
