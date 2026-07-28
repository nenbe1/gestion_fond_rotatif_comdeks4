import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MiseEnPage from './components/MiseEnPage';
import Connexion from './pages/Connexion';
import TableauDeBord from './pages/TableauDeBord';
import Beneficiaires from './pages/Beneficiaires';
import MembresComite from './pages/MembresComite';
import Financements from './pages/Financements';
import DetailFinancement from './pages/DetailFinancement';
import Demandes from './pages/Demandes';
import DetailDemande from './pages/DetailDemande';
import Rapports from './pages/Rapports';
import './App.css';

/**
 * Rôles autorisés à utiliser la plateforme Web — réservée à la Responsable
 * et (plus tard) à l'Administration. Les membres du comité et les
 * bénéficiaires sont destinés au client Mobile (répartition confirmée
 * par le président).
 */
const ROLES_AUTORISES_WEB = ['RESPONSABLE'];

/**
 * Protège une route :
 * - redirige vers /connexion si personne n'est connecté
 * - affiche un message d'accès refusé si le rôle connecté n'est pas
 *   autorisé sur le Web (plutôt qu'une redirection silencieuse, pour que
 *   ce soit clair pendant les tests/démo pourquoi l'accès est bloqué)
 */
function RouteProtegee({ children }) {
  const { utilisateur, deconnecter } = useAuth();

  if (!utilisateur) return <Navigate to="/connexion" replace />;

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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/connexion" element={<Connexion />} />
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
            <Route path="demandes" element={<Demandes />} />
            <Route path="demandes/:id" element={<DetailDemande />} />
            <Route path="rapports" element={<Rapports />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
