import { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import appelerApi from '../api/client';
import InfoBulleGraphique from '../components/InfoBulleGraphique';
import { formaterMontantCourt } from '../utils/formatage';

/**
 * Vue synthétique pour la Responsable : combien chaque canton a déjà
 * remboursé au fonds (remboursements collectifs confirmés uniquement —
 * donc réellement reversés, pas juste prévus). Le détail semaine par
 * semaine et la collecte individuelle restent sur le Mobile, gérés par
 * le comité ; ici on ne voit que la synthèse par canton.
 *
 * AJOUT : graphique en barres au-dessus du tableau, pour repérer d'un
 * coup d'œil les cantons qui remboursent le plus/le moins (module 6 du
 * cahier des charges — graphiques).
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

  const donneesGraphique = [...lignes]
    .sort((a, b) => b.montantRembourse - a.montantRembourse)
    .map((l) => ({ canton: l.cantonNom, 'Montant remboursé': Number(l.montantRembourse) }));

  return (
    <div>
      <div className="entete-page">
        <h1>Situation par canton</h1>
      </div>

      {erreur && <p className="message-erreur">{erreur}</p>}

      {chargement ? (
        <p>Chargement...</p>
      ) : (
        <>
          {donneesGraphique.length > 0 && (
            <div className="carte-graphique">
              <h2 className="titre-section-rapport">Remboursements par canton</h2>
              <p className="sous-titre-graphique">Du canton le plus contributeur au moins contributeur</p>
              <ResponsiveContainer width="100%" height={Math.max(260, donneesGraphique.length * 42)}>
                <BarChart data={donneesGraphique} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                  <CartesianGrid horizontal={false} stroke="#eef0ee" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} tickFormatter={formaterMontantCourt} />
                  <YAxis type="category" dataKey="canton" tick={{ fontSize: 12, fill: '#333' }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip
                    cursor={{ fill: 'rgba(44,74,58,0.05)' }}
                    content={<InfoBulleGraphique formaterValeur={(v) => `${v.toLocaleString('fr-FR')} FCFA`} />}
                  />
                  <Bar dataKey="Montant remboursé" radius={[0, 5, 5, 0]} maxBarSize={26}>
                    {donneesGraphique.map((entree, index) => (
                      <Cell key={entree.canton} fill={index === 0 ? '#c9a24b' : '#2c4a3a'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

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
        </>
      )}
    </div>
  );
}
