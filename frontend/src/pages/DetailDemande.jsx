import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import appelerApi from '../api/client';

const NIVEAUX_LIBELLES = {
  TRESORIER: 'Trésorier',
  COMMISSAIRE: 'Commissaire aux comptes',
  PRESIDENT: 'Président du comité',
};

/**
 * Page détail d'une demande de financement — le cœur de la démonstration.
 * Visualise le circuit de validation à 3 niveaux, permet d'approuver ou
 * rejeter chaque étape (dans l'ordre imposé par le backend), et affiche
 * la décision finale de la Responsable une fois le comité passé.
 */
export default function DetailDemande() {
  const { id } = useParams();
  const [demande, setDemande] = useState(null);
  const [circuit, setCircuit] = useState([]);
  const [fonds, setFonds] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [actionEnCours, setActionEnCours] = useState(false);
  const [decisionResponsable, setDecisionResponsable] = useState({ fond_rotatif_id: '', programme_id: '' });

  async function chargerTout() {
    setChargement(true);
    try {
      const [d, c] = await Promise.all([
        appelerApi(`/demandes-financement/${id}`),
        appelerApi(`/validations/demande/${id}`),
      ]);
      setDemande(d.demande);
      setCircuit(c.circuit);

      if (d.demande.statutGlobal === 'EnAttenteResponsable') {
        const [f, p] = await Promise.all([appelerApi('/fond-rotatif'), appelerApi('/programmes')]);
        setFonds(f.fonds);
        setProgrammes(p.programmes);
      }
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { chargerTout(); }, [id]);

  async function traiterEtape(validationId, decision) {
    setErreur('');
    setActionEnCours(true);
    try {
      await appelerApi(`/validations/${validationId}/traiter`, { method: 'PUT', body: { decision } });
      await chargerTout();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setActionEnCours(false);
    }
  }

  async function gererDecisionResponsable(decision) {
    setErreur('');
    setActionEnCours(true);
    try {
      await appelerApi(`/demandes-financement/${id}/decision-responsable`, {
        method: 'PUT',
        body: { decision, ...decisionResponsable },
      });
      await chargerTout();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setActionEnCours(false);
    }
  }

  if (chargement) return <p>Chargement...</p>;
  if (!demande) return <p>Demande introuvable.</p>;

  return (
    <div>
      <h1>Demande {demande.codeDemande}</h1>

      <div className="carte-info">
        <p><strong>Objet :</strong> {demande.objetDemande}</p>
        <p><strong>Montant :</strong> {Number(demande.montantDemande).toLocaleString('fr-FR')} FCFA</p>
        <p><strong>Bénéficiaires :</strong> {demande.nbFemmesBenef} femmes, {demande.nbHommesBenef} hommes</p>
        <p><strong>Statut :</strong> <span className={`badge badge-${demande.statutGlobal}`}>{demande.statutGlobal}</span></p>
      </div>

      {erreur && <p className="message-erreur">{erreur}</p>}

      <h2>Circuit de validation du comité</h2>
      <div className="circuit-validation">
        {circuit.map((etape, index) => {
          const etapePrecedenteApprouvee = index === 0 || circuit[index - 1].statut === 'Approuve';
          const peutTraiter = etape.statut === 'EnAttente' && etapePrecedenteApprouvee;

          return (
            <div key={etape.id} className={`etape-circuit etape-${etape.statut}`}>
              <div className="etape-numero">{etape.ordre}</div>
              <div className="etape-contenu">
                <strong>{NIVEAUX_LIBELLES[etape.niveau]}</strong>
                <span className={`badge badge-${etape.statut}`}>{etape.statut}</span>
                {etape.statut === 'EnAttente' && (
                  <div className="actions-etape">
                    <button
                      disabled={!peutTraiter || actionEnCours}
                      onClick={() => traiterEtape(etape.id, 'Approuve')}
                      title={!peutTraiter ? "L'étape précédente doit être approuvée d'abord" : ''}
                    >
                      Approuver
                    </button>
                    <button
                      className="bouton-danger"
                      disabled={!peutTraiter || actionEnCours}
                      onClick={() => traiterEtape(etape.id, 'Rejete')}
                    >
                      Rejeter
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {demande.statutGlobal === 'EnAttenteResponsable' && (
        <div className="carte-decision-responsable">
          <h2>Décision de la Responsable du Fond Rotatif</h2>
          <p>Le comité a validé cette demande en interne. La décision finale — avec droit de refus — revient à la Responsable.</p>
          <div className="grille-formulaire">
            <label>
              Fonds rotatif
              <select
                value={decisionResponsable.fond_rotatif_id}
                onChange={(e) => setDecisionResponsable({ ...decisionResponsable, fond_rotatif_id: e.target.value })}
              >
                <option value="">-- Choisir --</option>
                {fonds.map((f) => <option key={f.id} value={f.id}>{f.libelleFond} ({Number(f.montantFond).toLocaleString('fr-FR')} FCFA)</option>)}
              </select>
            </label>
            <label>
              Programme
              <select
                value={decisionResponsable.programme_id}
                onChange={(e) => setDecisionResponsable({ ...decisionResponsable, programme_id: e.target.value })}
              >
                <option value="">-- Choisir --</option>
                {programmes.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
              </select>
            </label>
          </div>
          <div className="actions-etape">
            <button
              disabled={actionEnCours || !decisionResponsable.fond_rotatif_id || !decisionResponsable.programme_id}
              onClick={() => gererDecisionResponsable('Approuve')}
            >
              Approuver et décaisser
            </button>
            <button className="bouton-danger" disabled={actionEnCours} onClick={() => gererDecisionResponsable('Rejete')}>
              Rejeter
            </button>
          </div>
        </div>
      )}

      {demande.statutGlobal === 'Validee' && (
        <div className="carte-succes">
          ✅ Financement créé — le fonds a été débité et le décaissement est effectif.
        </div>
      )}
    </div>
  );
}
