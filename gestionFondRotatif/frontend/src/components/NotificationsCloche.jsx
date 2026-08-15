import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import appelerApi from '../api/client';

const INTERVALLE_ACTUALISATION_MS = 30000; // 30s — suffisant pour un centre de notifications, pas besoin de websocket

/**
 * Cloche de notifications — badge du nombre de non-lues, liste
 * déroulante au clic. Actualisation par sondage périodique (polling),
 * pas de websocket : plus simple, suffisant pour ce volume d'usage.
 */
export default function NotificationsCloche() {
  const [ouverte, setOuverte] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [nombreNonLues, setNombreNonLues] = useState(0);
  const [chargement, setChargement] = useState(false);
  const conteneurRef = useRef(null);
  const navigate = useNavigate();

  async function chargerCompteur() {
    try {
      const donnees = await appelerApi('/notifications/non-lues/nombre');
      setNombreNonLues(donnees.total);
    } catch {
      // silencieux : un échec de sondage du compteur ne doit pas interrompre la navigation
    }
  }

  async function chargerListe() {
    setChargement(true);
    try {
      const donnees = await appelerApi('/notifications');
      setNotifications(donnees.notifications);
    } catch {
      // silencieux, idem
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    chargerCompteur();
    const intervalle = setInterval(chargerCompteur, INTERVALLE_ACTUALISATION_MS);
    return () => clearInterval(intervalle);
  }, []);

  // Referme la liste si on clique en dehors.
  useEffect(() => {
    function gererClicExterieur(e) {
      if (conteneurRef.current && !conteneurRef.current.contains(e.target)) setOuverte(false);
    }
    document.addEventListener('mousedown', gererClicExterieur);
    return () => document.removeEventListener('mousedown', gererClicExterieur);
  }, []);

  function basculerOuverture() {
    const nouvelEtat = !ouverte;
    setOuverte(nouvelEtat);
    if (nouvelEtat) chargerListe();
  }

  async function marquerLue(notif) {
    if (notif.lue) return;
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, lue: true } : n)));
    setNombreNonLues((n) => Math.max(0, n - 1));
    try {
      await appelerApi(`/notifications/${notif.id}/lue`, { method: 'PUT' });
    } catch {
      // best-effort : l'affichage local est déjà mis à jour, on ne relance pas d'erreur bloquante
    }
  }

  async function marquerToutesLues() {
    setNotifications((prev) => prev.map((n) => ({ ...n, lue: true })));
    setNombreNonLues(0);
    try {
      await appelerApi('/notifications/toutes/lues', { method: 'PUT' });
    } catch {
      // idem
    }
  }

  return (
    <div className="cloche-notifications" ref={conteneurRef}>
      <button className="bouton-cloche" onClick={basculerOuverture} aria-label="Notifications">
        🔔
        {nombreNonLues > 0 && <span className="badge-cloche">{nombreNonLues > 9 ? '9+' : nombreNonLues}</span>}
      </button>

      {ouverte && (
        <div className="liste-notifications">
          <div className="entete-liste-notifications">
            <strong>Notifications</strong>
            {notifications.some((n) => !n.lue) && (
              <button className="bouton-tout-lu" onClick={marquerToutesLues}>Tout marquer comme lu</button>
            )}
          </div>

          {chargement ? (
            <p className="vide-notifications">Chargement...</p>
          ) : notifications.length === 0 ? (
            <p className="vide-notifications">Aucune notification pour l'instant.</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`item-notification ${n.lue ? '' : 'item-notification-non-lue'}`}
                onClick={() => marquerLue(n)}
              >
                <p className="titre-notification">{n.titre}</p>
                <p className="message-notification">{n.message}</p>
                <p className="date-notification">{new Date(n.dateCreation).toLocaleString('fr-FR')}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
