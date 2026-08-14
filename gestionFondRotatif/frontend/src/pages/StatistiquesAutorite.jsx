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
 *
 * CORRECTION : ajout d'un tableau de détail par canton et par activité
 * (ex : "12 bénéficiaires du canton Balda ont reçu 450 000 FCFA pour
 * l'agriculture") — avant, seuls 3 totaux globaux étaient affichés, pas
 * de quoi savoir quel canton ou quelle activité était concerné.
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
    if (!window.confirm('Voulez-vous vraiment vous déconnecter ?')) return;
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
        <>
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

          <h2>Détail par canton et par activité</h2>
          <table className="tableau">
            <thead>
              <tr><th>Canton</th><th>Activité</th><th>Bénéficiaires</th><th>Montant total</th></tr>
            </thead>
            <tbody>
              {statistiques.repartition.map((ligne, index) => (
                <tr key={`${ligne.cantonNom}-${ligne.activite}-${index}`}>
                  <td>{ligne.cantonNom}</td>
                  <td>{ligne.activite}</td>
                  <td>{ligne.nombreBeneficiaires}</td>
                  <td>{ligne.montantTotal.toLocaleString('fr-FR')} FCFA</td>
                </tr>
              ))}
              {statistiques.repartition.length === 0 && (
                <tr><td colSpan="4" className="vide">Aucune donnée pour l'instant pour ce critère.</td></tr>
              )}
            </tbody>
          </table>
        </>
      )}

      <p className="note-confidentialite">
        Ces chiffres sont des totaux et des regroupements ; ils ne donnent accès à aucune information nominative sur les bénéficiaires.
      </p>
    </div>
  );
}
