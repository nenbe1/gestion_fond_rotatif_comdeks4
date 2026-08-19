/**
 * Tooltip personnalisé pour les graphiques recharts (Rapports,
 * Situation par canton, et tout futur graphique) — remplace le style
 * par défaut de recharts (boîte grise brute) par quelque chose de
 * cohérent avec le reste de l'interface (ombre, coins arrondis,
 * couleurs du thème).
 *
 * @param {boolean} active - fourni par recharts
 * @param {Array} payload - fourni par recharts (les séries survolées)
 * @param {string} label - fourni par recharts (ex: la période ou le canton)
 * @param {(valeur: number) => string} formaterValeur - comment afficher chaque nombre (ex: "1 200 000 FCFA", "42 %")
 */
export default function InfoBulleGraphique({ active, payload, label, formaterValeur }) {
  if (!active || !payload || payload.length === 0) return null;

  const formater = formaterValeur || ((v) => v.toLocaleString('fr-FR'));

  return (
    <div className="infobulle-graphique">
      <p className="infobulle-graphique-titre">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey || item.name} className="infobulle-graphique-ligne">
          <span className="infobulle-graphique-puce" style={{ backgroundColor: item.color || item.fill }} />
          {item.name} : <strong>{typeof item.value === 'number' ? formater(item.value) : item.value}</strong>
        </p>
      ))}
    </div>
  );
}
