import { useEffect, useState } from 'react';
import appelerApi from '../api/client';

/**
 * Page Conseiller IA (Web) — réservée à la Responsable (voir App.jsx,
 * ROLES_AUTORISES_WEB). Les membres du comité utilisent l'équivalent
 * Mobile (ConseillerIAScreen), qui ne consulte que le compte du
 * bénéficiaire connecté ; ici la Responsable choisit d'abord QUEL
 * bénéficiaire consulter, ce qui lui permet d'appuyer l'instruction
 * d'un dossier de prêt.
 *
 * Réutilise les endpoints /conseiller-ia/beneficiaires/:id/... créés
 * côté backend pour cet usage (jamais /conseiller-ia/demander ni
 * /analyse tout court, qui restent réservés au bénéficiaire lui-même).
 */
export default function ConseillerIA() {
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [chargementListe, setChargementListe] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [beneficiaireId, setBeneficiaireId] = useState('');

  const [messages, setMessages] = useState([]);
  const [historiqueCharge, setHistoriqueCharge] = useState(false);
  const [question, setQuestion] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [analyseEnCours, setAnalyseEnCours] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    (async () => {
      setChargementListe(true);
      try {
        const donnees = await appelerApi('/beneficiaires');
        setBeneficiaires(donnees.beneficiaires);
      } catch (err) {
        setErreur(err.message);
      } finally {
        setChargementListe(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!beneficiaireId) {
      setMessages([]);
      setHistoriqueCharge(false);
      return;
    }
    (async () => {
      setErreur('');
      setHistoriqueCharge(false);
      try {
        const donnees = await appelerApi(`/conseiller-ia/beneficiaires/${beneficiaireId}/historique`);
        const historiqueTrie = [...donnees.historique].reverse(); // le plus ancien en premier, comme une conversation
        setMessages(
          historiqueTrie.flatMap((echange) => [
            { id: `q-${echange.id}`, role: 'utilisateur', texte: echange.question },
            { id: `r-${echange.id}`, role: 'assistant', texte: echange.reponse },
          ])
        );
      } catch (err) {
        setErreur(err.message);
      } finally {
        setHistoriqueCharge(true);
      }
    })();
  }, [beneficiaireId]);

  const beneficiairesAffiches = beneficiaires.filter((b) => {
    const q = recherche.trim().toLowerCase();
    if (!q) return true;
    return `${b.nom} ${b.prenom} ${b.telephone}`.toLowerCase().includes(q);
  });

  async function envoyerQuestion(e) {
    e.preventDefault();
    const texte = question.trim();
    if (!texte || envoiEnCours || analyseEnCours || !beneficiaireId) return;

    setErreur('');
    setQuestion('');
    setMessages((prev) => [...prev, { id: `q-temp-${Date.now()}`, role: 'utilisateur', texte }]);
    setEnvoiEnCours(true);

    try {
      const donnees = await appelerApi(`/conseiller-ia/beneficiaires/${beneficiaireId}/demander`, {
        method: 'POST',
        body: { question: texte },
      });
      setMessages((prev) => [
        ...prev,
        { id: `r-${donnees.echange.id}`, role: 'assistant', texte: donnees.echange.reponse },
      ]);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  async function genererAnalyse() {
    if (envoiEnCours || analyseEnCours || !beneficiaireId) return;

    setErreur('');
    setMessages((prev) => [
      ...prev,
      { id: `q-temp-${Date.now()}`, role: 'utilisateur', texte: 'Analyse financière complète' },
    ]);
    setAnalyseEnCours(true);

    try {
      const donnees = await appelerApi(`/conseiller-ia/beneficiaires/${beneficiaireId}/analyse`, {
        method: 'POST',
      });
      setMessages((prev) => [
        ...prev,
        { id: `r-${donnees.echange.id}`, role: 'assistant', texte: donnees.echange.reponse },
      ]);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setAnalyseEnCours(false);
    }
  }

  const beneficiaireSelectionne = beneficiaires.find((b) => String(b.id) === String(beneficiaireId));

  return (
    <div>
      <h1>Conseiller IA</h1>
      <p className="sous-titre">
        Consultez l'analyse et les conseils de l'IA sur la situation financière d'un bénéficiaire,
        pour appuyer vos décisions pendant l'instruction d'un dossier.
      </p>

      {erreur && <p className="message-erreur">{erreur}</p>}

      <div className="grille-conseiller-ia">
        <div className="carte-info panneau-selection-beneficiaire">
          <input
            type="text"
            placeholder="Rechercher un bénéficiaire..."
            className="champ-recherche"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />

          {chargementListe ? (
            <p>Chargement...</p>
          ) : (
            <ul className="liste-selection-beneficiaires">
              {beneficiairesAffiches.map((b) => (
                <li key={b.id}>
                  <button
                    className={`item-selection-beneficiaire ${String(b.id) === String(beneficiaireId) ? 'selectionne' : ''}`}
                    onClick={() => setBeneficiaireId(b.id)}
                  >
                    <span className="nom-beneficiaire-selection">{b.nom} {b.prenom}</span>
                    <span className="detail-beneficiaire-selection">{b.telephone}</span>
                  </button>
                </li>
              ))}
              {beneficiairesAffiches.length === 0 && <p>Aucun bénéficiaire trouvé.</p>}
            </ul>
          )}
        </div>

        <div className="carte-info panneau-conversation-ia">
          {!beneficiaireId ? (
            <p className="message-invite-selection">Choisissez un bénéficiaire pour consulter le Conseiller IA.</p>
          ) : (
            <>
              <div className="entete-conversation-ia">
                <div>
                  <strong>{beneficiaireSelectionne?.nom} {beneficiaireSelectionne?.prenom}</strong>
                  <span className="sous-texte-entete-ia">Basé sur sa situation réelle</span>
                </div>
                <button
                  className="bouton-secondaire bouton-analyse-web"
                  onClick={genererAnalyse}
                  disabled={analyseEnCours || envoiEnCours}
                >
                  {analyseEnCours ? 'Génération...' : '📊 Analyse'}
                </button>
              </div>

              <div className="zone-messages-ia">
                {!historiqueCharge && <p>Chargement de l'historique...</p>}
                {messages.map((m) => (
                  <div key={m.id} className={`bulle-message-ia ${m.role === 'utilisateur' ? 'bulle-utilisateur' : 'bulle-assistant'}`}>
                    {m.role === 'utilisateur' ? (
                      m.texte
                    ) : (
                      m.texte.split('\n').map((ligne, i) => {
                        const estTitre = ligne.trim().startsWith('## ');
                        return estTitre
                          ? <div key={i} className="titre-section-reponse-ia">{ligne.trim().slice(3)}</div>
                          : <div key={i}>{ligne}</div>;
                      })
                    )}
                  </div>
                ))}
                {(envoiEnCours || analyseEnCours) && <p className="indicateur-chargement-ia">Le Conseiller IA réfléchit...</p>}
              </div>

              <form className="formulaire-question-ia" onSubmit={envoyerQuestion}>
                <input
                  type="text"
                  placeholder="Poser une question sur ce bénéficiaire..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={envoiEnCours || analyseEnCours}
                />
                <button type="submit" disabled={envoiEnCours || analyseEnCours || !question.trim()}>
                  Envoyer
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
