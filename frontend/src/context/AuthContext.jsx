import { createContext, useContext, useState } from 'react';
import appelerApi from '../api/client';

/**
 * Contexte d'authentification — partage l'utilisateur connecté et le
 * token dans toute l'application, sans avoir à les repasser en props
 * à chaque composant.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(() => {
    const stocke = localStorage.getItem('utilisateur');
    return stocke ? JSON.parse(stocke) : null;
  });

  /** Connecte l'utilisateur, stocke le token et ses infos. */
  async function connecter(telephone, mot_de_passe) {
    const donnees = await appelerApi('/authentification/connexion', {
      method: 'POST',
      body: { telephone, mot_de_passe },
    });
    localStorage.setItem('token', donnees.token);
    localStorage.setItem('utilisateur', JSON.stringify(donnees.utilisateur));
    setUtilisateur(donnees.utilisateur);
    return donnees.utilisateur;
  }

  /** Déconnecte l'utilisateur (efface le token local). */
  function deconnecter() {
    localStorage.removeItem('token');
    localStorage.removeItem('utilisateur');
    setUtilisateur(null);
  }

  return (
    <AuthContext.Provider value={{ utilisateur, connecter, deconnecter }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook d'accès au contexte d'authentification. */
export function useAuth() {
  return useContext(AuthContext);
}
