import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Page de connexion — point d'entrée de l'application.
 * Redirige vers le tableau de bord une fois connecté.
 */
export default function Connexion() {
  const [telephone, setTelephone] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const { connecter } = useAuth();
  const navigate = useNavigate();

  async function gererSoumission(e) {
    e.preventDefault();
    setErreur('');
    setChargement(true);
    try {
      await connecter(telephone, motDePasse);
      navigate('/');
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="page-connexion">
      <div className="bandeau-connexion">
        <div className="badge-connexion">🌱</div>
        <h1 className="titre-connexion">Gestion Fonds Rotatif</h1>
        <p className="sous-titre-connexion">COMDEKS4 — AJEOV Technologies</p>
      </div>

      <div className="carte-connexion">
        <form onSubmit={gererSoumission}>
          <label>
            Téléphone
            <div className="champ-conteneur">
              <span className="icone-champ">📱</span>
              <input
                type="text"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="Ex: 690000000"
                required
              />
            </div>
          </label>

          <label>
            Mot de passe
            <div className="champ-conteneur champ-mot-de-passe">
              <span className="icone-champ">🔒</span>
              <input
                type={motDePasseVisible ? 'text' : 'password'}
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                placeholder=" Entrez votre mot de passe"
                required
              />
              <button
                type="button"
                className="bouton-oeil"
                onClick={() => setMotDePasseVisible(!motDePasseVisible)}
                aria-label={motDePasseVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                tabIndex={-1}
              >
                {motDePasseVisible ? '🙈' : '👁'}
              </button>
            </div>
          </label>

          {erreur && <p className="message-erreur">{erreur}</p>}

          <button type="submit" className="bouton-connexion" disabled={chargement}>
            {chargement ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
