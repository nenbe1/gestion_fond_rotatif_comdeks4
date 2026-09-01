import { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, RefreshControl, Alert, Image, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import appelerApi, { BASE_URL } from '../../api/client';
import { couleurs } from '../../theme/couleurs';
import { choisirPhoto } from '../../utils/choisirPhoto';

// Le serveur sert les photos hors du préfixe /api (voir server.js,
// express.static monté sur /uploads) — on retire donc /api de BASE_URL
// pour reconstituer l'URL complète d'affichage d'une photo.
const ORIGINE_SERVEUR = BASE_URL.replace(/\/api\/?$/, '');

/**
 * Construit l'URL d'affichage d'une photo — Cloudinary renvoie une URL
 * complète (https://res.cloudinary.com/...), à utiliser telle quelle ;
 * l'ancien stockage local renvoyait un chemin relatif (/uploads/...),
 * conservé en repli pour les photos enregistrées avant la migration.
 */
function urlPhoto(photo) {
  if (!photo) return null;
  return photo.startsWith('http') ? photo : `${ORIGINE_SERVEUR}${photo}`;
}

/**
 * Liste des bénéficiaires de mon canton (comité), avec Modifier
 * (identité complète : nom, prénom, téléphone, sexe, photo, âge estimé,
 * activité — AJOUT : seuls âge/activité étaient modifiables jusqu'ici,
 * ce qui empêchait de corriger une faute de saisie ou un changement de
 * numéro), Supprimer, et un accès au Conseiller IA pour appuyer
 * l'instruction d'un dossier (même assistant que côté bénéficiaire, mais
 * interrogé ici par le membre du comité — voir ConseillerIAComiteScreen).
 * Même route backend que le Web pour la gestion (PUT/DELETE
 * /beneficiaires/:id), réservée au comité ET à la Responsable.
 */
export default function ListeBeneficiairesScreen() {
  const navigation = useNavigation();
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [idEnEdition, setIdEnEdition] = useState(null);
  const [nomEdition, setNomEdition] = useState('');
  const [prenomEdition, setPrenomEdition] = useState('');
  const [telephoneEdition, setTelephoneEdition] = useState('');
  const [sexeEdition, setSexeEdition] = useState('F');
  const [ageEdition, setAgeEdition] = useState('');
  const [activiteEdition, setActiviteEdition] = useState('');
  const [nouvellePhoto, setNouvellePhoto] = useState(null); // { uri, type, name } | null — changée seulement si le comité en reprend une
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const charger = useCallback(async () => {
    try {
      const donnees = await appelerApi('/beneficiaires');
      setBeneficiaires(donnees.beneficiaires);
      setErreur('');
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  function ouvrirEdition(b) {
    setIdEnEdition(b.id);
    setNomEdition(b.nom || '');
    setPrenomEdition(b.prenom || '');
    setTelephoneEdition(b.telephone || '');
    setSexeEdition(b.sexe || 'F');
    setAgeEdition(b.ageEstime ? String(b.ageEstime) : '');
    setActiviteEdition(b.activite || '');
    setNouvellePhoto(null);
  }

  /** Propose caméra ou galerie (voir utils/choisirPhoto.js). */
  async function reprendrePhoto() {
    const fichier = await choisirPhoto();
    if (fichier) setNouvellePhoto(fichier);
  }

  async function enregistrerEdition(b) {
    if (!nomEdition.trim() || !prenomEdition.trim() || !telephoneEdition.trim()) {
      Alert.alert('Erreur', 'Nom, prénom et téléphone sont requis.');
      return;
    }
    setEnvoiEnCours(true);
    try {
      await appelerApi(`/beneficiaires/${b.id}`, {
        method: 'PUT',
        body: {
          nom: nomEdition.trim(), prenom: prenomEdition.trim(), telephone: telephoneEdition.trim(), sexe: sexeEdition,
          age_estime: ageEdition, activite: activiteEdition, latitude: b.latitude, longitude: b.longitude,
        },
      });

      // La photo s'envoie à part (upload de fichier) — un échec ici
      // n'annule pas le reste de la modification, déjà enregistrée.
      if (nouvellePhoto) {
        try {
          const formulaire = new FormData();
          formulaire.append('photo', nouvellePhoto);
          await appelerApi(`/beneficiaires/${b.id}/photo`, { method: 'POST', body: formulaire });
        } catch (err) {
          Alert.alert('Photo non envoyée', `Les autres informations ont bien été enregistrées, mais la photo n'a pas pu être envoyée : ${err.message}`);
        }
      }

      setIdEnEdition(null);
      setNouvellePhoto(null);
      await charger();
    } catch (err) {
      Alert.alert('Erreur', err.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  function confirmerSuppression(b) {
    Alert.alert(
      'Supprimer ce bénéficiaire ?',
      `${b.nom} ${b.prenom} — action irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => supprimer(b) },
      ]
    );
  }

  async function supprimer(b) {
    try {
      await appelerApi(`/beneficiaires/${b.id}`, { method: 'DELETE' });
      await charger();
    } catch (err) {
      Alert.alert('Impossible de supprimer', err.message);
    }
  }

  return (
    <FlatList
      style={styles.conteneur}
      contentContainerStyle={styles.contenu}
      data={beneficiaires}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={chargement} onRefresh={charger} />}
      ListHeaderComponent={
        <TouchableOpacity style={styles.boutonAjouter} onPress={() => navigation.navigate('NouveauBeneficiaire')}>
          <Text style={styles.texteBoutonAjouter}>+ Nouveau bénéficiaire</Text>
        </TouchableOpacity>
      }
      ListEmptyComponent={!chargement ? <Text style={styles.vide}>{erreur || "Aucun bénéficiaire pour l'instant."}</Text> : null}
      renderItem={({ item }) => (
        <View style={styles.carte}>
          <View style={styles.entete}>
            {item.photo ? (
              <Image source={{ uri: urlPhoto(item.photo) }} style={styles.miniaturePhotoListe} />
            ) : (
              <View style={styles.miniaturePhotoListeVide}><Text style={styles.texteMiniaturePhotoVide}>👤</Text></View>
            )}
            <View style={styles.infosEntete}>
              <Text style={styles.nom}>{item.nom} {item.prenom}</Text>
              <Text style={styles.statut}>{item.statutMMF}</Text>
            </View>
          </View>
          <Text style={styles.telephone}>{item.telephone}</Text>

          {idEnEdition === item.id ? (
            <View>
              <View style={styles.rangeePhotoEdition}>
                <TouchableOpacity onPress={reprendrePhoto}>
                  {nouvellePhoto ? (
                    <Image source={{ uri: nouvellePhoto.uri }} style={styles.miniaturePhoto} />
                  ) : item.photo ? (
                    <Image source={{ uri: urlPhoto(item.photo) }} style={styles.miniaturePhoto} />
                  ) : (
                    <View style={styles.miniaturePhotoVide}><Text style={styles.texteMiniaturePhotoVide}>📷</Text></View>
                  )}
                </TouchableOpacity>
                <Text style={styles.texteChangerPhoto} onPress={reprendrePhoto}>Changer la photo</Text>
              </View>

              <Text style={styles.libelleChamp}>Nom</Text>
              <TextInput style={styles.champ} value={nomEdition} onChangeText={setNomEdition} />
              <Text style={styles.libelleChamp}>Prénom</Text>
              <TextInput style={styles.champ} value={prenomEdition} onChangeText={setPrenomEdition} />
              <Text style={styles.libelleChamp}>Téléphone</Text>
              <TextInput style={styles.champ} keyboardType="phone-pad" value={telephoneEdition} onChangeText={setTelephoneEdition} />
              <Text style={styles.libelleChamp}>Sexe</Text>
              <View style={styles.rangeeOptions}>
                {['F', 'M'].map((s) => (
                  <TouchableOpacity key={s} style={[styles.option, sexeEdition === s && styles.optionChoisie]} onPress={() => setSexeEdition(s)}>
                    <Text style={sexeEdition === s ? styles.texteOptionChoisie : styles.texteOption}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.libelleChamp}>Âge estimé</Text>
              <TextInput style={styles.champ} keyboardType="numeric" value={ageEdition} onChangeText={setAgeEdition} />
              <Text style={styles.libelleChamp}>Activité</Text>
              <TextInput style={styles.champ} value={activiteEdition} onChangeText={setActiviteEdition} />
              <View style={styles.actions}>
                <TouchableOpacity style={styles.boutonPrincipal} disabled={envoiEnCours} onPress={() => enregistrerEdition(item)}>
                  {envoiEnCours ? <ActivityIndicator size="small" color={couleurs.blanc} /> : <Text style={styles.texteBouton}>Enregistrer</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.boutonSecondaire} onPress={() => { setIdEnEdition(null); setNouvellePhoto(null); }}>
                  <Text style={styles.texteBoutonSecondaire}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <Text style={styles.infoLigne}>Âge estimé : {item.ageEstime ?? '—'}</Text>
              <Text style={styles.infoLigne}>Activité : {item.activite || '—'}</Text>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.boutonPrincipal} onPress={() => ouvrirEdition(item)}>
                  <Text style={styles.texteBouton}>Modifier</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.boutonIA}
                  onPress={() => navigation.navigate('ConseillerIAComite', { beneficiaireId: item.id, nomBeneficiaire: `${item.nom} ${item.prenom}` })}
                >
                  <Text style={styles.texteBouton}>🤖 Conseiller IA</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.boutonDanger} onPress={() => confirmerSuppression(item)}>
                  <Text style={styles.texteBouton}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.creme },
  contenu: { padding: 20 },
  boutonAjouter: { backgroundColor: couleurs.vertFonce, borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 14 },
  texteBoutonAjouter: { color: couleurs.blanc, fontWeight: '700', fontSize: 14 },
  vide: { textAlign: 'center', color: '#888', marginTop: 20 },
  carte: { backgroundColor: couleurs.blanc, borderRadius: 10, padding: 14, marginBottom: 10 },
  entete: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  infosEntete: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  miniaturePhotoListe: { width: 36, height: 36, borderRadius: 18 },
  miniaturePhotoListeVide: { width: 36, height: 36, borderRadius: 18, backgroundColor: couleurs.creme, alignItems: 'center', justifyContent: 'center' },
  nom: { fontWeight: '700', color: couleurs.grisTexte, fontSize: 15 },
  statut: { color: couleurs.vertMoyen, fontWeight: '600', fontSize: 12 },
  telephone: { color: '#666', fontSize: 13, marginBottom: 8 },
  infoLigne: { color: couleurs.grisTexte, fontSize: 13, marginBottom: 2 },
  libelleChamp: { color: '#666', fontSize: 12, marginTop: 6, marginBottom: 2 },
  champ: { borderWidth: 1, borderColor: couleurs.grisClair, borderRadius: 8, padding: 8, backgroundColor: couleurs.creme },
  rangeeOptions: { flexDirection: 'row', gap: 8 },
  option: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: couleurs.creme, borderWidth: 1, borderColor: couleurs.grisClair },
  optionChoisie: { backgroundColor: couleurs.vertFonce, borderColor: couleurs.vertFonce },
  texteOption: { color: couleurs.grisTexte, fontSize: 13 },
  texteOptionChoisie: { color: couleurs.blanc, fontSize: 13, fontWeight: '600' },
  rangeePhotoEdition: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  miniaturePhoto: { width: 48, height: 48, borderRadius: 8 },
  miniaturePhotoVide: { width: 48, height: 48, borderRadius: 8, backgroundColor: couleurs.creme, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: couleurs.grisClair, borderStyle: 'dashed' },
  texteMiniaturePhotoVide: { fontSize: 18 },
  texteChangerPhoto: { color: couleurs.vertMoyen, fontSize: 13, fontWeight: '600' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  boutonPrincipal: { backgroundColor: couleurs.vertFonce, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  boutonSecondaire: { backgroundColor: couleurs.grisClair, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  boutonDanger: { backgroundColor: couleurs.brique, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  boutonIA: { backgroundColor: couleurs.vertMoyen, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  texteBouton: { color: couleurs.blanc, fontWeight: '600', fontSize: 13 },
  texteBoutonSecondaire: { color: couleurs.grisTexte, fontWeight: '600', fontSize: 13 },
});
