import { useEffect, useState } from 'react';
import appelerApi, { BASE_URL } from '../api/client';

// Le serveur sert les photos hors du préfixe /api (voir server.js,
// express.static monté sur /uploads) — on retire donc /api de BASE_URL
// pour reconstituer l'URL complète d'affichage d'une photo.
const ORIGINE_SERVEUR = BASE_URL.replace(/\/api\/?$/, '');

/**
 * Page Bénéficiaires — les bénéficiaires sont créés exclusivement par
 * les membres du comité, sur le Mobile (jamais depuis le Web) — pour
 * garder la traçabilité de qui a enregistré qui, sur le terrain.
 *
 * AJOUT : Modifier permet maintenant de changer l'identité complète
 * (nom, prénom, téléphone, sexe, photo), pas seulement âge estimé et
 * activité comme avant — corrige la même limitation que côté Mobile. La
 * photo est aussi affichée en permanence dans la liste (pas seulement en
 * édition) : elle sert à identifier physiquement le bénéficiaire au
 * quotidien, pas seulement au moment de la prise de vue sur le terrain.
 * Suppression accessible depuis le Web à la Responsable (et depuis le
 * Mobile au comité — même restriction de rôle côté backend). La
 * suppression est refusée par le backend si le bénéficiaire a déjà une
 * demande ou une répartition liée.
 */
export default function Beneficiaires() {
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [cantons, setCantons] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [cantonSelectionne, setCantonSelectionne] = useState('');
  const [recherche, setRecherche] = useState('');

  const [beneficiaireEnEditionId, setBeneficiaireEnEditionId] = useState(null);
  const [formulaireEdition, setFormulaireEdition] = useState({ nom: '', prenom: '', telephone: '', sexe: 'F', age_estime: '', activite: '' });
  const [nouvellePhotoFichier, setNouvellePhotoFichier] = useState(null); // File | null
  const [apercuNouvellePhoto, setApercuNouvellePhoto] = useState(null); // URL locale de prévisualisation
  const [envoiEditionEnCours, setEnvoiEditionEnCours] = useState(false);
  const [suppressionEnCoursId, setSuppressionEnCoursId] = useState(null);

  async function charger() {
    setChargement(true);
    try {
      const [donnees, c] = await Promise.all([
        appelerApi('/beneficiaires'),
        appelerApi('/membres-comite/reference/cantons'),
      ]);
      setBeneficiaires(donnees.beneficiaires);
      setCantons(c.cantons);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { charger(); }, []);

  const beneficiairesAffiches = beneficiaires
    .filter((b) => !cantonSelectionne || String(b.cantonId) === String(cantonSelectionne))
    .filter((b) => {
      const q = recherche.trim().toLowerCase();
      if (!q) return true;
      return `${b.nom} ${b.prenom} ${b.telephone}`.toLowerCase().includes(q);
    });

  function ouvrirEdition(b) {
    setBeneficiaireEnEditionId(b.id);
    setFormulaireEdition({
      nom: b.nom ?? '', prenom: b.prenom ?? '', telephone: b.telephone ?? '', sexe: b.sexe ?? 'F',
      age_estime: b.ageEstime ?? '', activite: b.activite ?? '',
    });
    setNouvellePhotoFichier(null);
    setApercuNouvellePhoto(null);
  }

  function gererChoixPhoto(fichier) {
    setNouvellePhotoFichier(fichier);
    setApercuNouvellePhoto(fichier ? URL.createObjectURL(fichier) : null);
  }

  async function gererEnregistrementEdition(b) {
    if (!formulaireEdition.nom.trim() || !formulaireEdition.prenom.trim() || !formulaireEdition.telephone.trim()) {
      setErreur('Nom, prénom et téléphone sont requis.');
      return;
    }
    setErreur('');
    setEnvoiEditionEnCours(true);
    try {
      await appelerApi(`/beneficiaires/${b.id}`, {
        method: 'PUT',
        body: { ...formulaireEdition, latitude: b.latitude, longitude: b.longitude },
      });

      // La photo s'envoie à part (upload de fichier, pas du JSON) — un
      // échec ici n'annule pas le reste de la modification, déjà
      // enregistrée à ce stade.
      if (nouvellePhotoFichier) {
        try {
          const formulaire = new FormData();
          formulaire.append('photo', nouvellePhotoFichier);
          await appelerApi(`/beneficiaires/${b.id}/photo`, { method: 'POST', body: formulaire });
        } catch (err) {
          setErreur(`Les autres informations ont été enregistrées, mais la photo n'a pas pu être envoyée : ${err.message}`);
        }
      }

      setBeneficiaireEnEditionId(null);
      setNouvellePhotoFichier(null);
      setApercuNouvellePhoto(null);
      await charger();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiEditionEnCours(false);
    }
  }

  async function gererSuppression(b) {
    if (!window.confirm(`Supprimer définitivement ${b.nom} ${b.prenom} ? Cette action est irréversible.`)) return;

    setErreur('');
    setSuppressionEnCoursId(b.id);
    try {
      await appelerApi(`/beneficiaires/${b.id}`, { method: 'DELETE' });
      await charger();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setSuppressionEnCoursId(null);
    }
  }

  return (
    <div>
      <div className="entete-page">
        <h1>Bénéficiaires</h1>
        <div className="groupe-filtres">
          <input
            type="text"
            className="champ-recherche"
            placeholder="Rechercher (nom, prénom, téléphone)..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
          <label>
            Canton
            <select value={cantonSelectionne} onChange={(e) => setCantonSelectionne(e.target.value)}>
              <option value="">Tous les cantons</option>
              {cantons.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </label>
        </div>
      </div>

      {erreur && <p className="message-erreur">{erreur}</p>}

      {chargement ? (
        <p>Chargement...</p>
      ) : (
        <table className="tableau">
          <thead>
            <tr>
              <th>Photo</th><th>Nom</th><th>Prénom</th><th>Sexe</th><th>Canton</th><th>Téléphone</th><th>Âge estimé</th><th>Activité</th><th>Statut MMF</th><th></th>
            </tr>
          </thead>
          <tbody>
            {beneficiairesAffiches.map((b) => (
              <tr key={b.id}>
                {beneficiaireEnEditionId === b.id ? (
                  <>
                    <td>
                      <label className="miniature-photo-modifiable">
                        {(apercuNouvellePhoto || b.photo) ? (
                          <img
                            src={apercuNouvellePhoto || `${ORIGINE_SERVEUR}${b.photo}`}
                            alt=""
                            className="miniature-photo"
                          />
                        ) : (
                          <div className="miniature-photo-vide">👤</div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(e) => gererChoixPhoto(e.target.files?.[0] || null)}
                        />
                      </label>
                    </td>
                    <td>
                      <input
                        value={formulaireEdition.nom}
                        onChange={(e) => setFormulaireEdition({ ...formulaireEdition, nom: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        value={formulaireEdition.prenom}
                        onChange={(e) => setFormulaireEdition({ ...formulaireEdition, prenom: e.target.value })}
                      />
                    </td>
                    <td>
                      <select
                        value={formulaireEdition.sexe}
                        onChange={(e) => setFormulaireEdition({ ...formulaireEdition, sexe: e.target.value })}
                      >
                        <option value="F">F</option>
                        <option value="M">M</option>
                      </select>
                    </td>
                    <td>{b.cantonNom || '—'}</td>
                    <td>
                      <input
                        value={formulaireEdition.telephone}
                        onChange={(e) => setFormulaireEdition({ ...formulaireEdition, telephone: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={formulaireEdition.age_estime}
                        onChange={(e) => setFormulaireEdition({ ...formulaireEdition, age_estime: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        value={formulaireEdition.activite}
                        onChange={(e) => setFormulaireEdition({ ...formulaireEdition, activite: e.target.value })}
                      />
                    </td>
                    <td><span className={`badge badge-${b.statutMMF}`}>{b.statutMMF}</span></td>
                    <td className="actions-ligne">
                      <button disabled={envoiEditionEnCours} onClick={() => gererEnregistrementEdition(b)}>
                        {envoiEditionEnCours ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                      <button type="button" onClick={() => setBeneficiaireEnEditionId(null)}>Annuler</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>
                      {b.photo ? (
                        <img src={`${ORIGINE_SERVEUR}${b.photo}`} alt="" className="miniature-photo" />
                      ) : (
                        <div className="miniature-photo-vide">👤</div>
                      )}
                    </td>
                    <td>{b.nom}</td>
                    <td>{b.prenom}</td>
                    <td>{b.sexe}</td>
                    <td>{b.cantonNom || '—'}</td>
                    <td>{b.telephone}</td>
                    <td>{b.ageEstime ?? '—'}</td>
                    <td>{b.activite || '—'}</td>
                    <td><span className={`badge badge-${b.statutMMF}`}>{b.statutMMF}</span></td>
                    <td className="actions-ligne">
                      <button className="bouton-icone" title="Modifier" onClick={() => ouvrirEdition(b)}>✏️</button>
                      <button
                        className="bouton-icone bouton-danger"
                        title="Supprimer"
                        disabled={suppressionEnCoursId === b.id}
                        onClick={() => gererSuppression(b)}
                      >
                        {suppressionEnCoursId === b.id ? '...' : '🗑️'}
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {beneficiairesAffiches.length === 0 && (
              <tr><td colSpan="10" className="vide">Aucun bénéficiaire ne correspond à ces critères.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
