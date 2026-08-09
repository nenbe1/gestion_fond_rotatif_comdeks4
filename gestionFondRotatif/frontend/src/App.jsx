import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MiseEnPage from './components/MiseEnPage';
import Connexion from './pages/Connexion';
import TableauDeBord from './pages/TableauDeBord';
import Beneficiaires from './pages/Beneficiaires';
import MembresComite from './pages/MembresComite';
import Financements from './pages/Financements';
import RemboursementsAttente from './pages/RemboursementsAttente';
import DetailFinancement from './pages/DetailFinancement';
import Demandes from './pages/Demandes';
import DetailDemande from './pages/DetailDemande';
import SituationCantons from './pages/SituationCantons';
import Rapports from './pages/Rapports';
import Autorites from './pages/Autorites';
import Administration from './pages/Administration';
import Parametrage from './pages/Parametrage';
import StatistiquesAutorite from './pages/StatistiquesAutorite';
import './App.css';

/**
 * Rôles autorisés à utiliser la plateforme Web — réservée à la Responsable
 * et (plus tard) à l'Administration. Les membres du comité et les
 * bénéficiaires sont destinés au client Mobile (répartition confirmée
 * par le président). Les Autorites (délégués institutionnels) ont un accès
 * Web, mais à une page dédiée uniquement (voir RouteProtegee) — jamais à
 * l'interface complète de gestion.
 */
const ROLES_AUTORISES_WEB = ['RESPONSABLE'];

/**
 * Protège une route :
 * - redirige vers /connexion si personne n'est connecté
 * - redirige un délégué (AUTORITE) vers sa page de statistiques dédiée,
 *   jamais vers l'interface complète de gestion
 * - affiche un message d'accès refusé si le rôle connecté n'est pas
 *   autorisé sur le Web (plutôt qu'une redirection silencieuse, pour que
 *   ce soit clair pendant les tests/démo pourquoi l'accès est bloqué)
 */
function RouteProtegee({ children }) {
  const { utilisateur, deconnecter } = useAuth();

  if (!utilisateur) return <Navigate to="/connexion" replace />;

  if (utilisateur.role === 'AUTORITE') return <Navigate to="/mes-statistiques" replace />;

  if (!ROLES_AUTORISES_WEB.includes(utilisateur.role)) {
    return (
      <div className="page-connexion">
        <div className="carte-connexion">
          <h1>Accès non autorisé</h1>
          <p className="sous-titre">
            Cette plateforme Web est réservée à la Responsable du Fond
            Rotatif et à l'Administration. Les membres du comité et les
            bénéficiaires utilisent l'application Mobile (en cours de
            développement).
          </p>
          <button onClick={deconnecter}>Se déconnecter</button>
        </div>
      </div>
    );
  }

  return children;
}

/**
 * Garde dédiée à la page du délégué : accessible uniquement au rôle
 * AUTORITE. Un autre rôle connecté (ex. Responsable) qui arriverait sur
 * cette URL par erreur est renvoyé vers l'accueil de son propre espace.
 */
function RouteAutorite({ children }) {
  const { utilisateur } = useAuth();

  if (!utilisateur) return <Navigate to="/connexion" replace />;
  if (utilisateur.role !== 'AUTORITE') return <Navigate to="/" replace />;

  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/connexion" element={<Connexion />} />
          <Route
            path="/mes-statistiques"
            element={
              <RouteAutorite>
                <StatistiquesAutorite />
              </RouteAutorite>
            }
          />
          <Route
            path="/"
            element={
              <RouteProtegee>
                <MiseEnPage />
              </RouteProtegee>
            }
          >
            <Route index element={<TableauDeBord />} />
            <Route path="beneficiaires" element={<Beneficiaires />} />
            <Route path="membres-comite" element={<MembresComite />} />
            <Route path="financements" element={<Financements />} />
            <Route path="financements/:id" element={<DetailFinancement />} />
            <Route path="remboursements-attente" element={<RemboursementsAttente />} />
            <Route path="demandes" element={<Demandes />} />
            <Route path="demandes/:id" element={<DetailDemande />} />
            <Route path="situation-cantons" element={<SituationCantons />} />
            <Route path="rapports" element={<Rapports />} />
            <Route path="autorites" element={<Autorites />} />
            <Route path="administration" element={<Administration />} />
            <Route path="parametrage" element={<Parametrage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
