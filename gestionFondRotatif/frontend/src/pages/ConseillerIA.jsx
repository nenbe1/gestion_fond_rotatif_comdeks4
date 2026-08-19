import { useEffect, useState } from 'react';
import appelerApi from '../api/client';

/**
 * Page Conseiller IA (Web) — réservée à la Responsable (voir App.jsx,
 * ROLES_AUTORISES_WEB). Elle consulte la situation agrégée d'un CANTON
 * entier, pas d'un bénéficiaire précis : chaque canton a son propre
 * membre du comité sur le terrain, qui lui utilise le Conseiller IA au
 * niveau du bénéficiaire depuis le Mobile (écran équivalent côté
 * comité). La Responsable garde ainsi une vision d'ensemble par canton
 * avant de se pencher sur un dossier individuel avec le comité local.
 *
 * Réutilise les endpoints /conseiller-ia/cantons/:id/... créés côté
 * backend pour cet usage.
 */
export default function ConseillerIA() {
  const [cantons, setCantons] = useState([]);
  const [chargementListe, setChargementListe] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [cantonId, setCantonId] = useState('');

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
        const donnees = await appelerApi('/membres-comite/reference/cantons');
        setCantons(donnees.cantons);
      } catch (err) {
        setErreur(err.message);
      } finally {
        setChargementListe(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!cantonId) {
      setMessages([]);
      setHistoriqueCharge(false);
      return;
    }
    (async () => {
      setErreur('');
      setHistoriqueCharge(false);
      try {
        const donnees = await appelerApi(`/conseiller-ia/cantons/${cantonId}/historique`);
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
  }, [cantonId]);

  const cantonsAffiches = cantons.filter((c) => {
    const q = recherche.trim().toLowerCase();
    if (!q) return true;
    return c.nom.toLowerCase().includes(q);
  });

  async function envoyerQuestion(e) {
    e.preventDefault();
    const texte = question.trim();
    if (!texte || envoiEnCours || analyseEnCours || !cantonId) return;

    setErreur('');
    setQuestion('');
    setMessages((prev) => [...prev, { id: `q-temp-${Date.now()}`, role: 'utilisateur', texte }]);
    setEnvoiEnCours(true);

    try {
      const donnees = await appelerApi(`/conseiller-ia/cantons/${cantonId}/demander`, {
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
    if (envoiEnCours || analyseEnCours || !cantonId) return;

    setErreur('');
    setMessages((prev) => [
      ...prev,
      { id: `q-temp-${Date.now()}`, role: 'utilisateur', texte: 'Analyse financière complète' },
    ]);
    setAnalyseEnCours(true);

    try {
      const donnees = await appelerApi(`/conseiller-ia/cantons/${cantonId}/analyse`, {
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

  const cantonSelectionne = cantons.find((c) => String(c.id) === String(cantonId));

  return (
    <div>
      <h1>Conseiller IA</h1>
      <p className="sous-titre">
        Consultez l'analyse et les conseils de l'IA sur la situation financière d'un canton,
        pour garder une vision d'ensemble avant de vous pencher sur un dossier avec le comité local.
      </p>

      {erreur && <p className="message-erreur">{erreur}</p>}

      <div className="grille-conseiller-ia">
        <div className="carte-info panneau-selection-beneficiaire">
          <input
            type="text"
            placeholder="Rechercher un canton..."
            className="champ-recherche"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />

          {chargementListe ? (
            <p>Chargement...</p>
          ) : (
            <ul className="liste-selection-beneficiaires">
              {cantonsAffiches.map((c) => (
                <li key={c.id}>
                  <button
                    className={`item-selection-beneficiaire ${String(c.id) === String(cantonId) ? 'selectionne' : ''}`}
                    onClick={() => setCantonId(c.id)}
                  >
                    <span className="nom-beneficiaire-selection">{c.nom}</span>
                  </button>
                </li>
              ))}
              {cantonsAffiches.length === 0 && <p>Aucun canton trouvé.</p>}
            </ul>
          )}
        </div>

        <div className="carte-info panneau-conversation-ia">
          {!cantonId ? (
            <p className="message-invite-selection">Choisissez un canton pour consulter le Conseiller IA.</p>
          ) : (
            <>
              <div className="entete-conversation-ia">
                <div>
                  <strong>Canton de {cantonSelectionne?.nom}</strong>
                  <span className="sous-texte-entete-ia">Basé sur la situation réelle du canton</span>
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
                  placeholder="Poser une question sur ce canton..."
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
