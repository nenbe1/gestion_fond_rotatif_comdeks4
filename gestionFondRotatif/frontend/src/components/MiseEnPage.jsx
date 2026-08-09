import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Mise en page principale — barre latérale de navigation + zone de
 * contenu (Outlet, remplie par la route active).
 *
 * AJOUT (responsive) : sous 900px la barre latérale passe en icônes
 * seules (tablette) ; sous 640px elle devient un menu qui se déplie via
 * un bouton ☰ dans une barre du haut (téléphone), avec un fond assombri
 * derrière qu'on peut cliquer pour refermer — avant, la mise en page
 * était figée pour desktop uniquement.
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
      { to: '/remboursements-attente', icone: '↩️', libelle: 'Remboursements en attente' },
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
      { to: '/parametrage', icone: '🛠️', libelle: 'Paramétrage' },
      { to: '/administration', icone: '⚙️', libelle: 'Administration' },
    ],
  },
];

export default function MiseEnPage() {
  const { utilisateur, deconnecter } = useAuth();
  const navigate = useNavigate();
  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false);

  function gererDeconnexion() {
    deconnecter();
    navigate('/connexion');
  }

  function fermerMenuMobile() {
    setMenuMobileOuvert(false);
  }

  return (
    <div className="mise-en-page">
      {/* Barre du haut : uniquement visible sur téléphone (voir CSS), porte le bouton ☰. */}
      <header className="barre-mobile">
        <button className="bouton-menu-mobile" onClick={() => setMenuMobileOuvert(true)} aria-label="Ouvrir le menu">☰</button>
        <span className="logo-mobile">Fonds Rotatif</span>
      </header>

      {/* Fond assombri derrière le menu déplié, cliquer dessus le referme. */}
      {menuMobileOuvert && <div className="fond-menu-mobile" onClick={fermerMenuMobile} />}

      <aside className={`barre-laterale ${menuMobileOuvert ? 'ouverte' : ''}`}>
        <div className="entete-barre-laterale">
          <div className="logo">Fonds Rotatif</div>
          <button className="bouton-fermer-menu-mobile" onClick={fermerMenuMobile} aria-label="Fermer le menu">✕</button>
        </div>
        <nav>
          {GROUPES_NAV.map((groupe, index) => (
            <div className="groupe-nav" key={groupe.titre || `groupe-${index}`}>
              {groupe.titre && <div className="titre-groupe-nav">{groupe.titre}</div>}
              {groupe.liens.map((lien) => (
                <NavLink key={lien.to} to={lien.to} end={lien.end} onClick={fermerMenuMobile}>
                  <span className="icone-nav" aria-hidden="true">{lien.icone}</span>
                  <span className="libelle-nav">{lien.libelle}</span>
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
