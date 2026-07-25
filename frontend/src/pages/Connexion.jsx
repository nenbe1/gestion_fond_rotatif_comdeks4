import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

/**
 * Page de connexion — point d'entrée de l'application.
 * Redirige vers le tableau de bord une fois connecté.
 */
export default function Connexion() {
  const [telephone, setTelephone] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false);
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
      <div className="carte-connexion">
        <h1>Système de Gestion du Fonds Rotatif</h1>
        <p className="sous-titre">
          COMDEKS4 — AJEOV Technologies
        </p>

        <form onSubmit={gererSoumission}>

          <label>
            Téléphone
            <input
              type="text"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder=" Ex: 690000000"
              required
            />
          </label>

          <label>
            Mot de passe

            <div className="champ-mot-de-passe">
              <input
                 type={afficherMotDePasse ? 'text' : 'password'}
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="Entrez votre mot de passe"
                  autoComplete="current-password"
                  required
              />

              <button
                type="button"
                className="bouton-oeil"
                onClick={() =>
                  setAfficherMotDePasse(!afficherMotDePasse)
                }
              >
                {afficherMotDePasse ? (
                  <FaEyeSlash />
                ) : (
                  <FaEye />
                )}
              </button>
            </div>
          </label>

          {erreur && (
            <p className="message-erreur">{erreur}</p>
          )}

          <button
            type="submit"
            disabled={chargement}
          >
            {chargement
              ? 'Connexion...'
              : 'Se connecter'}
          </button>

        </form>
      </div>
    </div>
  );
}