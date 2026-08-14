import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// CORRECTION classique Leaflet + bundlers (Vite/Webpack) : les icônes par
// défaut ne se chargent pas car le bundler ne résout pas les chemins
// d'images internes au package. On pointe directement vers le CDN
// unpkg (même version que le package installé) pour éviter tout souci
// de résolution de fichiers, quelle que soit la config du bundler.
const iconeParDefaut = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const CENTRE_PAR_DEFAUT = [10.596, 14.325]; // Maroua, Extrême-Nord Cameroun — zone d'activité du projet
const ZOOM_PAR_DEFAUT = 8;

/** Recentre la carte en douceur quand la position change (résultat de recherche ou prop initiale). */
function RecentrerCarte({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 13);
  }, [position, map]);
  return null;
}

/** Capture les clics sur la carte pour positionner le marqueur. */
function GestionnaireClic({ onClic }) {
  useMapEvents({ click: (e) => onClic(e.latlng.lat, e.latlng.lng) });
  return null;
}

/**
 * Sélecteur de position — recherche par nom (via Nominatim/OpenStreetMap,
 * gratuit, sans clé) OU clic direct sur la carte. Les deux méthodes
 * mènent au même résultat : latitude/longitude renvoyées via onChange.
 *
 * NOTE : Nominatim est un service public à usage raisonnable (pas
 * d'automatisation massive). Pour cet usage interne (quelques recherches
 * ponctuelles par la Responsable), c'est largement dans les clous —
 * si l'usage devait un jour devenir intensif, prévoir un service de
 * géocodage payant à la place.
 *
 * @param {number|null} latitude
 * @param {number|null} longitude
 * @param {(lat: number, lng: number) => void} onChange
 */
export default function SelecteurPositionCarte({ latitude, longitude, onChange }) {
  const [recherche, setRecherche] = useState('');
  const [resultats, setResultats] = useState([]);
  const [rechercheEnCours, setRechercheEnCours] = useState(false);
  const [erreurRecherche, setErreurRecherche] = useState('');
  const delaiRecherche = useRef(null);

  const positionActuelle = (latitude && longitude) ? [Number(latitude), Number(longitude)] : null;

  function gererSaisieRecherche(valeur) {
    setRecherche(valeur);
    setResultats([]);
    clearTimeout(delaiRecherche.current);
    if (valeur.trim().length < 3) return;

    // Anti-rebond : on attend que l'utilisateur arrête de taper avant
    // d'interroger le service, pour ne pas le solliciter à chaque lettre.
    delaiRecherche.current = setTimeout(async () => {
      setRechercheEnCours(true);
      setErreurRecherche('');
      try {
        const reponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(valeur)}`
        );
        if (!reponse.ok) throw new Error('Le service de recherche est momentanément indisponible.');
        const donnees = await reponse.json();
        setResultats(donnees);
        if (donnees.length === 0) setErreurRecherche("Aucun lieu trouvé — clique directement sur la carte à la place.");
      } catch (err) {
        setErreurRecherche(err.message);
      } finally {
        setRechercheEnCours(false);
      }
    }, 500);
  }

  function choisirResultat(r) {
    onChange(Number(r.lat), Number(r.lon));
    setRecherche(r.display_name);
    setResultats([]);
  }

  return (
    <div className="selecteur-carte">
      <div className="recherche-carte">
        <input
          type="text"
          placeholder="Rechercher un lieu (ex: Balda, Maroua)..."
          value={recherche}
          onChange={(e) => gererSaisieRecherche(e.target.value)}
        />
        {rechercheEnCours && <span className="note-recherche">Recherche...</span>}
        {resultats.length > 0 && (
          <ul className="resultats-recherche">
            {resultats.map((r) => (
              <li key={r.place_id} onClick={() => choisirResultat(r)}>{r.display_name}</li>
            ))}
          </ul>
        )}
        {erreurRecherche && <p className="note-recherche">{erreurRecherche}</p>}
      </div>

      <MapContainer
        center={positionActuelle || CENTRE_PAR_DEFAUT}
        zoom={positionActuelle ? 13 : ZOOM_PAR_DEFAUT}
        style={{ height: '280px', borderRadius: 'var(--rayon)' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GestionnaireClic onClic={onChange} />
        {positionActuelle && <>
          <Marker position={positionActuelle} icon={iconeParDefaut} />
          <RecentrerCarte position={positionActuelle} />
        </>}
      </MapContainer>

      <p className="note-recherche">
        {positionActuelle
          ? `Position : ${positionActuelle[0].toFixed(5)}, ${positionActuelle[1].toFixed(5)} — clique ailleurs sur la carte pour ajuster.`
          : 'Cherche un lieu ci-dessus, ou clique directement sur la carte pour placer le point.'}
      </p>
    </div>
  );
}
