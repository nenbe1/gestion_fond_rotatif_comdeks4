/**
 * Formate un montant en version courte pour l'affichage sur un axe de
 * graphique (l'espace y est compté) — la valeur exacte reste visible
 * dans l'infobulle au survol (voir InfoBulleGraphique).
 * @param {number} valeur
 * @returns {string} ex: "850 k", "1,2 M", "320"
 */
export function formaterMontantCourt(valeur) {
  const nombre = Number(valeur);
  if (Math.abs(nombre) >= 1_000_000) {
    return `${(nombre / 1_000_000).toFixed(1).replace('.0', '').replace('.', ',')} M`;
  }
  if (Math.abs(nombre) >= 1_000) {
    return `${Math.round(nombre / 1_000)} k`;
  }
  return `${nombre}`;
}
