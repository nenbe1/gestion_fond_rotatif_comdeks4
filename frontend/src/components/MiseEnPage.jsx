import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Mise en page principale — barre latérale de navigation + zone de
 * contenu (Outlet, remplie par la route active).
 */
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
          <NavLink to="/" end>Tableau de bord</NavLink>
          <NavLink to="/beneficiaires">Bénéficiaires</NavLink>
          <NavLink to="/membres-comite">Membres du comité</NavLink>
          <NavLink to="/demandes">Demandes de financement</NavLink>
          <NavLink to="/rapports">Rapports</NavLink>
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
