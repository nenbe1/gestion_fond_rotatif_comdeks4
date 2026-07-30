import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import appelerApi from '../api/client';

/**
 * Page dédiée aux comptes Autorite (délégués institutionnels — Jeunesse,
 * Femmes, Agriculture...). Volontairement séparée de MiseEnPage : un
 * délégué n'a accès à rien d'autre qu'à ses propres statistiques
 * globales, jamais au détail nominatif des bénéficiaires ni aux autres
 * modules de gestion du fonds.
 */
export default function StatistiquesAutorite() {
  const [statistiques, setStatistiques] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const { utilisateur, deconnecter } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function charger() {
      try {
        const donnees = await appelerApi('/autorites/moi/statistiques');
        setStatistiques(donnees.statistiques);
      } catch (err) {
        setErreur(err.message);
      } finally {
        setChargement(false);
      }
    }
    charger();
  }, []);

  function gererDeconnexion() {
    deconnecter();
    navigate('/connexion');
  }

  return (
    <div className="page-statistiques-autorite">
      <header className="entete-page">
        <div>
          <h1>{utilisateur?.nom} {utilisateur?.prenom}</h1>
          {statistiques && <p className="sous-titre">{statistiques.fonction} — {statistiques.critere}</p>}
        </div>
        <button onClick={gererDeconnexion}>Déconnexion</button>
      </header>

      {chargement && <p>Chargement...</p>}
      {erreur && <p className="message-erreur">{erreur}</p>}

      {statistiques && (
        <div className="grille-cartes-statistiques">
          <div className="carte-statistique">
            <span className="valeur">{statistiques.nombreBeneficiaires}</span>
            <span className="libelle">Bénéficiaires touchés</span>
          </div>
          <div className="carte-statistique">
            <span className="valeur">{statistiques.nombreFinancements}</span>
            <span className="libelle">Financements accordés</span>
          </div>
          <div className="carte-statistique">
            <span className="valeur">{Number(statistiques.montantTotal).toLocaleString('fr-FR')} FCFA</span>
            <span className="libelle">Montant total financé</span>
          </div>
        </div>
      )}

      <p className="note-confidentialite">
        Ces chiffres sont des totaux globaux ; ils ne donnent accès à aucune information nominative sur les bénéficiaires.
      </p>
    </div>
  );
}
