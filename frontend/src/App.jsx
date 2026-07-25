import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MiseEnPage from './components/MiseEnPage';
import Connexion from './pages/Connexion';
import TableauDeBord from './pages/TableauDeBord';
import Beneficiaires from './pages/Beneficiaires';
import Demandes from './pages/Demandes';
import DetailDemande from './pages/DetailDemande';
import Rapports from './pages/Rapports';
import './App.css';

/**
 * Protège une route : redirige vers /connexion si personne n'est connecté.
 */
function RouteProtegee({ children }) {
  const { utilisateur } = useAuth();
  if (!utilisateur) return <Navigate to="/connexion" replace />;
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
