import { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import * as Location from 'expo-location';
import appelerApi from '../../api/client';
import { couleurs } from '../../theme/couleurs';
import { choisirPhoto } from '../../utils/choisirPhoto';

/**
 * Enregistrement direct d'un bénéficiaire (Mobile, comité), indépendant
 * de toute demande de financement — jusqu'ici la seule façon d'enregistrer
 * un nouveau bénéficiaire était le mini-formulaire intégré à
 * CreerDemandeScreen (voir "+ Nouveau bénéficiaire" dans le circuit de
 * demande). Cet écran reprend exactement la même logique et le même
 * appel backend (POST /beneficiaires, déjà prévu pour ça côté serveur),
 * mais accessible directement depuis la liste des bénéficiaires — utile
 * pour enregistrer un lot de bénéficiaires réels sans créer de demande.
 * Un mot de passe par défaut est généré à partir du téléphone, comme
 * dans CreerDemandeScreen : le comité le communique au bénéficiaire.
 */
export default function NouveauBeneficiaireScreen({ navigation }) {
  const [nouveauBeneficiaire, setNouveauBeneficiaire] = useState({ nom: '', prenom: '', sexe: 'F', telephone: '', age_estime: '', activite: '' });
  const [photo, setPhoto] = useState(null); // { uri, type, name } | null — optionnelle
  const [localisation, setLocalisation] = useState(null); // { latitude, longitude } | null — optionnelle
  const [localisationEnCours, setLocalisationEnCours] = useState(false);
  const [creationEnCours, setCreationEnCours] = useState(false);
  const [erreur, setErreur] = useState('');

  async function prendrePhoto() {
    const fichier = await choisirPhoto();
    if (fichier) setPhoto(fichier);
  }

  async function localiser() {
    setLocalisationEnCours(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', "L'accès à la position est nécessaire pour enregistrer la localisation du bénéficiaire.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setLocalisation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    } catch {
      Alert.alert('Erreur', "Impossible d'obtenir la position actuelle. Réessayez, ou continuez sans localisation.");
    } finally {
      setLocalisationEnCours(false);
    }
  }

  async function creerBeneficiaire() {
    const { nom, prenom, sexe, telephone, age_estime, activite } = nouveauBeneficiaire;
    if (!nom.trim() || !prenom.trim() || !telephone.trim()) {
      Alert.alert('Erreur', 'Nom, prénom et téléphone sont requis.');
      return;
    }
    const chiffres = telephone.replace(/\D/g, '');
    const motDePasseParDefaut = `mmf${chiffres.slice(-4).padStart(4, '0')}`;

    setCreationEnCours(true);
    setErreur('');
    try {
      const donnees = await appelerApi('/beneficiaires', {
        method: 'POST',
        body: {
          nom: nom.trim(), prenom: prenom.trim(), sexe, telephone: telephone.trim(),
          mot_de_passe: motDePasseParDefaut,
          age_estime: age_estime ? Number(age_estime) : undefined,
          activite: activite.trim() || undefined,
          latitude: localisation?.latitude,
          longitude: localisation?.longitude,
        },
      });
      const b = donnees.beneficiaire;

      // La photo s'envoie à part (upload de fichier, pas du JSON) — un
      // échec ici n'annule pas la création du compte, déjà réussie à ce
      // stade : le comité pourra ajouter la photo plus tard depuis la liste.
      if (photo) {
        try {
          const formulaire = new FormData();
          formulaire.append('photo', photo);
          await appelerApi(`/beneficiaires/${b.id}/photo`, { method: 'POST', body: formulaire });
        } catch (err) {
          Alert.alert('Photo non envoyée', `Le compte a bien été créé, mais la photo n'a pas pu être envoyée : ${err.message}`);
        }
      }

      Alert.alert(
        'Bénéficiaire enregistré',
        `${nom.trim()} ${prenom.trim()} a été enregistré(e). Mot de passe par défaut : ${motDePasseParDefaut}`
      );
      navigation.goBack();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setCreationEnCours(false);
    }
  }

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

      <Text style={styles.libelleChamp}>Nom</Text>
      <TextInput style={styles.champ} value={nouveauBeneficiaire.nom} onChangeText={(t) => setNouveauBeneficiaire({ ...nouveauBeneficiaire, nom: t })} autoFocus />
      <Text style={styles.libelleChamp}>Prénom</Text>
      <TextInput style={styles.champ} value={nouveauBeneficiaire.prenom} onChangeText={(t) => setNouveauBeneficiaire({ ...nouveauBeneficiaire, prenom: t })} />
      <Text style={styles.libelleChamp}>Sexe</Text>
      <View style={styles.rangeeOptions}>
        {['F', 'M'].map((s) => (
          <TouchableOpacity key={s} style={[styles.option, nouveauBeneficiaire.sexe === s && styles.optionChoisie]} onPress={() => setNouveauBeneficiaire({ ...nouveauBeneficiaire, sexe: s })}>
            <Text style={nouveauBeneficiaire.sexe === s ? styles.texteOptionChoisie : styles.texteOption}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.libelleChamp}>Téléphone</Text>
      <TextInput style={styles.champ} keyboardType="phone-pad" value={nouveauBeneficiaire.telephone} onChangeText={(t) => setNouveauBeneficiaire({ ...nouveauBeneficiaire, telephone: t })} placeholder="+237 6xx xxx xxx" />
      <Text style={styles.libelleChamp}>Âge estimé</Text>
      <TextInput style={styles.champ} keyboardType="numeric" value={nouveauBeneficiaire.age_estime} onChangeText={(t) => setNouveauBeneficiaire({ ...nouveauBeneficiaire, age_estime: t })} placeholder="Ex : 34" />
      <Text style={styles.libelleChamp}>Activité</Text>
      <TextInput style={styles.champ} value={nouveauBeneficiaire.activite} onChangeText={(t) => setNouveauBeneficiaire({ ...nouveauBeneficiaire, activite: t })} placeholder="Ex : maraîchage, élevage de volailles..." />

      <Text style={styles.libelleChamp}>Photo et localisation (facultatif)</Text>
      <View style={styles.rangee2Colonnes}>
        <TouchableOpacity style={styles.boutonOptionnel} onPress={prendrePhoto}>
          {photo ? (
            <Image source={{ uri: photo.uri }} style={styles.miniaturePhoto} />
          ) : (
            <Text style={styles.texteBoutonOptionnel}>📷 Prendre une photo</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.boutonOptionnel} onPress={localiser} disabled={localisationEnCours}>
          {localisationEnCours ? (
            <ActivityIndicator size="small" color={couleurs.vertFonce} />
          ) : (
            <Text style={styles.texteBoutonOptionnel}>{localisation ? '📍 Position enregistrée' : '📍 Localiser'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.boutonValider} onPress={creerBeneficiaire} disabled={creationEnCours}>
        {creationEnCours ? <ActivityIndicator color={couleurs.blanc} /> : <Text style={styles.texteBoutonValider}>Enregistrer le bénéficiaire</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.creme },
  contenu: { padding: 20, paddingBottom: 60 },
  erreur: { color: couleurs.brique, marginBottom: 12 },
  libelleChamp: { fontSize: 13, color: couleurs.grisTexte, marginTop: 14, marginBottom: 6, fontWeight: '600' },
  champ: { borderWidth: 1, borderColor: couleurs.grisClair, borderRadius: 8, padding: 10, fontSize: 15, backgroundColor: couleurs.blanc },
  rangeeOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rangee2Colonnes: { flexDirection: 'row', gap: 10, marginTop: 4 },
  option: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: couleurs.blanc, borderWidth: 1, borderColor: couleurs.grisClair },
  optionChoisie: { backgroundColor: couleurs.vertFonce, borderColor: couleurs.vertFonce },
  texteOption: { color: couleurs.grisTexte, fontSize: 13 },
  texteOptionChoisie: { color: couleurs.blanc, fontSize: 13, fontWeight: '600' },
  boutonOptionnel: {
    flex: 1, borderWidth: 1, borderColor: couleurs.grisClair, borderStyle: 'dashed', borderRadius: 8,
    padding: 10, alignItems: 'center', justifyContent: 'center', minHeight: 44,
  },
  texteBoutonOptionnel: { color: couleurs.grisTexte, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  miniaturePhoto: { width: 40, height: 40, borderRadius: 6 },
  boutonValider: { backgroundColor: couleurs.vertFonce, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 28 },
  texteBoutonValider: { color: couleurs.blanc, fontWeight: '700', fontSize: 15 },
});
