import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Mise en page principale — barre latérale de navigation + zone de
 * contenu (Outlet, remplie par la route active).
 *
 * CORRECTION : la barre latérale était une simple liste de liens à plat.
 * Regroupée maintenant par section (Terrain / Finances / Pilotage /
 * Système), avec une icône par lien, pour donner des repères visuels et
 * une hiérarchie plutôt qu'une liste indifférenciée.
 */
const GROUPES_NAV = [
  {
    titre: null, // pas de titre pour le tout premier lien (page d'accueil)
    liens: [
      { to: '/', end: true, icone: '📊', libelle: 'Tableau de bord' },
    ],
  },
  {
    titre: 'Terrain',
    liens: [
      { to: '/beneficiaires', icone: '👥', libelle: 'Bénéficiaires' },
      { to: '/membres-comite', icone: '🧑‍🤝‍🧑', libelle: 'Membres du comité' },
    ],
  },
  {
    titre: 'Finances',
    liens: [
      { to: '/demandes', icone: '📝', libelle: 'Demandes de financement' },
      { to: '/financements', icone: '💰', libelle: 'Financements' },
    ],
  },
  {
    titre: 'Pilotage',
    liens: [
      { to: '/situation-cantons', icone: '🗺️', libelle: 'Situation par canton' },
      { to: '/rapports', icone: '📈', libelle: 'Rapports' },
      { to: '/autorites', icone: '🏛️', libelle: 'Autorités' },
    ],
  },
  {
    titre: 'Système',
    liens: [
      { to: '/administration', icone: '⚙️', libelle: 'Administration' },
    ],
  },
];

export default function MiseEnPage() {
  const { utilisateur, deconnecter } = useAuth();
  const navigate = useNavigate();

  function gererDeconnexion() {
    deconnecter();
    navigate('/connexion');
  }

  return (
    <div className="mise-en-page">
      <aside className="barre-laterale">
        <div className="logo">Fonds Rotatif</div>
        <nav>
          {GROUPES_NAV.map((groupe, index) => (
            <div className="groupe-nav" key={groupe.titre || `groupe-${index}`}>
              {groupe.titre && <div className="titre-groupe-nav">{groupe.titre}</div>}
              {groupe.liens.map((lien) => (
                <NavLink key={lien.to} to={lien.to} end={lien.end}>
                  <span className="icone-nav" aria-hidden="true">{lien.icone}</span>
                  <span>{lien.libelle}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="pied-barre">
          <p>{utilisateur?.nom} {utilisateur?.prenom}</p>
          <button onClick={gererDeconnexion}>Déconnexion</button>
        </div>
      </aside>
      <main className="contenu-principal">
        <Outlet />
      </main>
    </div>
  );
}
