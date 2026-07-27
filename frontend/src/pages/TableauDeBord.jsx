import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import appelerApi from '../api/client';

/**
 * Tableau de bord — vue d'ensemble rapide à l'ouverture de l'application :
 * nombre de bénéficiaires, demandes en attente d'action, état du fonds.
 */
export default function TableauDeBord() {
  const [donnees, setDonnees] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    async function charger() {
      try {
        const [b, d, f] = await Promise.all([
          appelerApi('/beneficiaires'),
          appelerApi('/demandes-financement'),
          appelerApi('/fond-rotatif'),
        ]);
        setDonnees({
          beneficiaires: b.beneficiaires,
          demandes: d.demandes,
          fonds: f.fonds,
        });
      } catch (err) {
        setErreur(err.message);
      }
    }
    charger();
  }, []);

  if (erreur) return <p className="message-erreur">{erreur}</p>;
  if (!donnees) return <p>Chargement...</p>;

  // Seules les demandes où il ne reste que la décision de la Responsable
  // sont "à traiter" pour le Web — celles encore EnCours au niveau du
  // comité sont gérées côté Mobile (comité de canton).
  const demandesEnAttente = donnees.demandes.filter(
    (d) => d.statutGlobal === 'EnAttenteResponsable'
  );
  const soldeTotal = donnees.fonds.reduce((total, f) => total + Number(f.montantFond), 0);

  return (
    <div>
      <h1>Tableau de bord</h1>

      <div className="grille-cartes-kpi">
        <div className="carte-kpi">
          <span className="kpi-valeur">{donnees.beneficiaires.length}</span>
          <span className="kpi-label">Bénéficiaires</span>
        </div>
        <div className="carte-kpi">
          <span className="kpi-valeur">{donnees.demandes.length}</span>
          <span className="kpi-label">Demandes de financement</span>
        </div>
        <div className="carte-kpi">
          <span className="kpi-valeur">{demandesEnAttente.length}</span>
          <span className="kpi-label">En attente d'action</span>
        </div>
        <div className="carte-kpi">
          <span className="kpi-valeur">{soldeTotal.toLocaleString('fr-FR')}</span>
          <span className="kpi-label">FCFA disponibles (fonds)</span>
        </div>
      </div>

      <h2>Demandes nécessitant une action</h2>
      {demandesEnAttente.length === 0 ? (
        <p className="vide">Aucune demande en attente actuellement.</p>
      ) : (
        <table className="tableau">
          <thead><tr><th>Code</th><th>Objet</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            {demandesEnAttente.map((d) => (
              <tr key={d.id}>
                <td>{d.codeDemande}</td>
                <td>{d.objetDemande}</td>
                <td><span className={`badge badge-${d.statutGlobal}`}>{d.statutGlobal}</span></td>
                <td><Link to={`/demandes/${d.id}`}>Traiter →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
