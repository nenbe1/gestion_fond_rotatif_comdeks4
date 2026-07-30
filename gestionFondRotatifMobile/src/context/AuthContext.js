import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import appelerApi from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null);
  // Le stockage mobile est asynchrone (contrairement à localStorage sur
  // Web) : on ne sait pas tout de suite si quelqu'un est déjà connecté.
  const [enChargement, setEnChargement] = useState(true);

  useEffect(() => {
    async function chargerSession() {
      const stocke = await AsyncStorage.getItem('utilisateur');
      if (stocke) setUtilisateur(JSON.parse(stocke));
      setEnChargement(false);
    }
    chargerSession();
  }, []);

  /** Connecte l'utilisateur, stocke le token et ses infos. */
  async function connecter(telephone, mot_de_passe) {
    const donnees = await appelerApi('/authentification/connexion', {
      method: 'POST',
      body: { telephone, mot_de_passe },
    });
    await AsyncStorage.setItem('token', donnees.token);
    await AsyncStorage.setItem('utilisateur', JSON.stringify(donnees.utilisateur));
    setUtilisateur(donnees.utilisateur);
    return donnees.utilisateur;
  }

  /** Déconnecte l'utilisateur (efface le token local). */
  async function deconnecter() {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('utilisateur');
    setUtilisateur(null);
  }

  return (
    <AuthContext.Provider value={{ utilisateur, enChargement, connecter, deconnecter }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
