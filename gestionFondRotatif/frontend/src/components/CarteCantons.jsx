import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const iconeParDefaut = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const CENTRE_PAR_DEFAUT = [10.596, 14.325]; // Maroua, Extrême-Nord Cameroun

/** Cadre automatiquement la carte pour que tous les points soient visibles. */
function AjusterCadrage({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 13);
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [30, 30] });
    }
  }, [points, map]);
  return null;
}

/**
 * Carte d'ensemble en lecture seule — un marqueur par canton ayant une
 * position enregistrée (latitude/longitude non nulles). Les cantons sans
 * position ne peuvent simplement pas être placés, ils sont juste absents
 * de la carte (voir la note affichée par le composant appelant).
 * @param {Array<{id, nom, latitude, longitude}>} cantons
 */
export default function CarteCantons({ cantons }) {
  const cantonsAvecPosition = cantons.filter((c) => c.latitude && c.longitude);
  const points = cantonsAvecPosition.map((c) => [Number(c.latitude), Number(c.longitude)]);

  return (
    <MapContainer
      center={CENTRE_PAR_DEFAUT}
      zoom={8}
      style={{ height: '420px', borderRadius: 'var(--rayon)' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <AjusterCadrage points={points} />
      {cantonsAvecPosition.map((c) => (
        <Marker key={c.id} position={[Number(c.latitude), Number(c.longitude)]} icon={iconeParDefaut}>
          <Popup>
            <strong>{c.nom}</strong>
            {!c.actif && <><br /><em>Désactivé</em></>}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
