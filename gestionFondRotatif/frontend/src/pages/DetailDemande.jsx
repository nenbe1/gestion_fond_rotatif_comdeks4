import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import appelerApi from '../api/client';

const NIVEAUX_LIBELLES = {
  TRESORIER: 'Trésorier',
  COMMISSAIRE: 'Commissaire aux comptes',
  PRESIDENT: 'Président du comité',
};

/**
 * Page détail d'une demande de financement — consultation côté
 * Responsable/Administration. Le circuit de validation du comité
 * (Trésorier -> Commissaire -> Président) est traité exclusivement sur
 * le Mobile par les membres concernés ; ici on ne fait qu'observer sa
 * progression. La seule action possible sur le Web est la décision
 * finale de la Responsable, une fois le circuit interne terminé.
 */
export default function DetailDemande() {
  const { id } = useParams();
  const [demande, setDemande] = useState(null);
  const [circuit, setCircuit] = useState([]);
  const [beneficiairesPrevus, setBeneficiairesPrevus] = useState([]);
  const [fonds, setFonds] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [actionEnCours, setActionEnCours] = useState(false);
  const [decisionResponsable, setDecisionResponsable] = useState({ fond_rotatif_id: '', programme_id: '' });

  // CORRECTION : chaque appel a maintenant son propre try/catch.
  // Avant, un Promise.all groupait les 3 appels : si UN SEUL echouait
  // (ex. /beneficiaires-prevus), "demande" restait a null et l'ecran
  // affichait "Demande introuvable" meme si la vraie erreur etait
  // ailleurs. Maintenant, un echec sur le circuit ou les beneficiaires
  // prevus n'empeche plus d'afficher la demande, et le vrai message
  // d'erreur remonte a l'ecran si c'est la demande elle-meme qui echoue.
  async function chargerTout() {
    setChargement(true);
    setErreur('');

    let demandeChargee;
    try {
      const d = await appelerApi(`/demandes-financement/${id}`);
      demandeChargee = d.demande;
      setDemande(d.demande);
    } catch (err) {
      setErreur(err.message);
      setChargement(false);
      return;
    }

    try {
      const c = await appelerApi(`/validations/demande/${id}`);
      setCircuit(c.circuit);
    } catch (err) {
      console.error('Erreur chargement circuit de validation :', err.message);
    }

    try {
      const bp = await appelerApi(`/demandes-financement/${id}/beneficiaires-prevus`);
      setBeneficiairesPrevus(bp.beneficiairesPrevus);
    } catch (err) {
      console.error('Erreur chargement beneficiaires prevus :', err.message);
    }

    if (demandeChargee.statutGlobal === 'EnAttenteResponsable') {
      try {
        const [f, p] = await Promise.all([appelerApi('/fond-rotatif'), appelerApi('/programmes')]);
        setFonds(f.fonds);
        setProgrammes(p.programmes);
      } catch (err) {
        console.error('Erreur chargement fonds/programmes :', err.message);
      }
    }

    setChargement(false);
  }

  useEffect(() => { chargerTout(); }, [id]);

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
  if (erreur && !demande) return <p className="message-erreur">{erreur}</p>;
  if (!demande) return <p>Demande introuvable.</p>;

  return (
    <div>
      <h1>Demande {demande.codeDemande}</h1>

      <div className="carte-info">
        <p><strong>Canton :</strong> {demande.cantonNom || '—'}</p>
        <p><strong>Objet :</strong> {demande.objetDemande}</p>
        <p><strong>Montant :</strong> {Number(demande.montantDemande).toLocaleString('fr-FR')} FCFA</p>
        <p><strong>Bénéficiaires :</strong> {demande.nbFemmesBenef} femmes, {demande.nbHommesBenef} hommes</p>
        <p><strong>Statut :</strong> <span className={`badge badge-${demande.statutGlobal}`}>{demande.statutGlobal}</span></p>
      </div>

      {erreur && <p className="message-erreur">{erreur}</p>}

      <h2>Bénéficiaires visés</h2>
      <div className="carte-info">
        {beneficiairesPrevus.length === 0 ? (
          <p className="vide">Aucun bénéficiaire renseigné pour cette demande.</p>
        ) : (
          <ul>
            {beneficiairesPrevus.map((bp) => (
              <li key={bp.id}>
                {bp.beneficiaireId ? `${bp.beneficiaireNom} ${bp.beneficiairePrenom}` : `${bp.nomLibre} (nom libre)`}
              </li>
            ))}
          </ul>
        )}
      </div>

      <h2>Circuit de validation du comité</h2>
      <p className="note">Traité exclusivement par les membres du comité concernés, sur le Mobile.</p>
      <div className="circuit-validation">
        {circuit.map((etape) => (
          <div key={etape.id} className={`etape-circuit etape-${etape.statut}`}>
            <div className="etape-numero">{etape.ordre}</div>
            <div className="etape-contenu">
              <strong>{NIVEAUX_LIBELLES[etape.niveau]}</strong>
              <span className={`badge badge-${etape.statut}`}>{etape.statut}</span>
            </div>
          </div>
        ))}
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
          {' '}<Link to="/financements">Voir les financements →</Link>
        </div>
      )}
    </div>
  );
}
