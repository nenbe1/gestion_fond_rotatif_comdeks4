import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import * as Location from 'expo-location';
import appelerApi from '../../api/client';
import { couleurs } from '../../theme/couleurs';
import { choisirPhoto } from '../../utils/choisirPhoto';

const FORMULAIRE_VIDE = {
  vague_id: '', domaine_id: '', objet_demande: '', montant_demande: '',
  nb_femmes_benef: '', nb_hommes_benef: '',
  resultat_attendu: '', periode_previsionnelle: '', site_travail: '',
  co_financement_en_nature: '', co_financement_especes: '',
};

/**
 * Création d'une demande de financement par le comité (Mobile). La
 * Responsable ne fait que valider/refuser une fois le circuit interne
 * du comité terminé — c'est bien le comité qui propose la demande, avec
 * la liste des bénéficiaires visés (sans montant à ce stade : juste
 * "qui" sera concerné, pour que la Responsable le sache avant de statuer).
 */
export default function CreerDemandeScreen({ navigation }) {
  const [formulaire, setFormulaire] = useState(FORMULAIRE_VIDE);
  const [vagues, setVagues] = useState([]);
  const [domaines, setDomaines] = useState([]);
  const [beneficiairesExistants, setBeneficiairesExistants] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreur, setErreur] = useState('');

  const [beneficiairesPrevus, setBeneficiairesPrevus] = useState([]); // [{ type: 'existant', id, label } | { type: 'libre', label }]
  const [modeAjout, setModeAjout] = useState(null); // null | 'existant' | 'libre'
  const [nouveauBeneficiaire, setNouveauBeneficiaire] = useState({ nom: '', prenom: '', sexe: 'F', telephone: '', age_estime: '', activite: '' });
  const [photo, setPhoto] = useState(null); // { uri, type, name } | null — optionnelle
  const [localisation, setLocalisation] = useState(null); // { latitude, longitude } | null — optionnelle
  const [localisationEnCours, setLocalisationEnCours] = useState(false);
  const [creationEnCours, setCreationEnCours] = useState(false);

  useEffect(() => {
    async function charger() {
      try {
        const [v, d, b] = await Promise.all([
          appelerApi('/vagues'),
          appelerApi('/domaines'),
          appelerApi('/beneficiaires'),
        ]);
        setVagues(v.vagues);
        setDomaines(d.domaines);
        setBeneficiairesExistants(b.beneficiaires);
      } catch (err) {
        setErreur(err.message);
      } finally {
        setChargement(false);
      }
    }
    charger();
  }, []);

  function gererChangement(champ, valeur) {
    setFormulaire({ ...formulaire, [champ]: valeur });
  }

  function ajouterBeneficiaireExistant(b) {
    if (beneficiairesPrevus.some((bp) => bp.type === 'existant' && bp.id === b.id)) return;
    setBeneficiairesPrevus([...beneficiairesPrevus, { type: 'existant', id: b.id, label: `${b.nom} ${b.prenom}` }]);
    setModeAjout(null);
  }

  /**
   * Propose caméra ou galerie (voir utils/choisirPhoto.js) — pas de
   * capture forcée en direct, le comité peut réutiliser une photo déjà
   * prise. Optionnelle : peut être ignorée sans bloquer la création.
   */
  async function prendrePhoto() {
    const fichier = await choisirPhoto();
    if (fichier) setPhoto(fichier);
  }

  /**
   * Un seul bouton, une seule position — pas de saisie manuelle de
   * coordonnées (trop lent et source d'erreur sur le terrain).
   * Précision "Balanced" plutôt que "High" : nettement plus rapide à
   * obtenir un point GPS, largement suffisant pour situer un bénéficiaire
   * à l'échelle d'un canton. Optionnelle comme la photo.
   */
  async function localiser() {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', "L'accès à la position est nécessaire pour enregistrer la localisation du bénéficiaire.");
      return;
    }
    setLocalisationEnCours(true);
    try {
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocalisation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    } catch {
      Alert.alert('Erreur', "Impossible d'obtenir la position actuelle. Réessayez, ou continuez sans localisation.");
    } finally {
      setLocalisationEnCours(false);
    }
  }

  /**
   * Crée réellement le compte du bénéficiaire (pas juste un nom en texte
   * libre) — c'est la seule façon d'enregistrer un nouveau bénéficiaire
   * dans l'app : au moment où le comité le propose dans une demande. Un
   * mot de passe par défaut est généré (à partir du téléphone) : le
   * comité le communique au bénéficiaire, qui pourra le changer plus tard.
   */
  async function creerEtAjouterBeneficiaire() {
    const { nom, prenom, sexe, telephone, age_estime, activite } = nouveauBeneficiaire;
    if (!nom.trim() || !prenom.trim() || !telephone.trim()) {
      Alert.alert('Erreur', 'Nom, prénom et téléphone sont requis.');
      return;
    }
    const chiffres = telephone.replace(/\D/g, '');
    const motDePasseParDefaut = `mmf${chiffres.slice(-4).padStart(4, '0')}`;

    setCreationEnCours(true);
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
      // stade : le comité pourra ajouter la photo plus tard si besoin.
      if (photo) {
        try {
          const formulaire = new FormData();
          formulaire.append('photo', photo);
          await appelerApi(`/beneficiaires/${b.id}/photo`, { method: 'POST', body: formulaire });
        } catch (err) {
          Alert.alert('Photo non envoyée', `Le compte a bien été créé, mais la photo n'a pas pu être envoyée : ${err.message}`);
        }
      }

      setBeneficiairesPrevus([...beneficiairesPrevus, { type: 'existant', id: b.id, label: `${b.nom} ${b.prenom}` }]);
      setNouveauBeneficiaire({ nom: '', prenom: '', sexe: 'F', telephone: '', age_estime: '', activite: '' });
      setPhoto(null);
      setLocalisation(null);
      setModeAjout(null);
      Alert.alert(
        'Compte créé',
        `Le compte de ${b.nom} ${b.prenom} a été créé.\nMot de passe par défaut : ${motDePasseParDefaut}\n\nCommuniquez-le-lui — il pourra le changer plus tard.`
      );
    } catch (err) {
      Alert.alert('Erreur', err.message);
    } finally {
      setCreationEnCours(false);
    }
  }

  function retirerBeneficiaire(index) {
    setBeneficiairesPrevus(beneficiairesPrevus.filter((_, i) => i !== index));
  }

  async function gererEnvoi() {
    if (!formulaire.vague_id || !formulaire.domaine_id || !formulaire.objet_demande || !formulaire.montant_demande) {
      Alert.alert('Erreur', 'Remplissez au minimum la vague, le domaine, l\'objet et le montant.');
      return;
    }
    if (beneficiairesPrevus.length === 0) {
      Alert.alert('Erreur', 'Ajoutez au moins un bénéficiaire visé par cette demande.');
      return;
    }
    setEnvoiEnCours(true);
    setErreur('');
    try {
      await appelerApi('/demandes-financement', {
        method: 'POST',
        body: {
          ...formulaire,
          beneficiaires_prevus: beneficiairesPrevus.map((bp) =>
            bp.type === 'existant' ? { beneficiaire_id: bp.id } : { nom_libre: bp.label }
          ),
        },
      });
      Alert.alert('Demande créée', 'La demande a été transmise au circuit de validation du comité.', [
        { text: 'OK', onPress: () => navigation.navigate('TableauDeBord') },
      ]);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  if (chargement) return <ActivityIndicator style={{ marginTop: 40 }} color={couleurs.vertFonce} />;

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

      <Text style={styles.libelleChamp}>Vague</Text>
      <View style={styles.rangeeOptions}>
        {vagues.map((v) => (
          <TouchableOpacity key={v.id} style={[styles.option, formulaire.vague_id === v.id && styles.optionChoisie]} onPress={() => gererChangement('vague_id', v.id)}>
            <Text style={formulaire.vague_id === v.id ? styles.texteOptionChoisie : styles.texteOption}>{v.nom}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.libelleChamp}>Domaine</Text>
      <View style={styles.rangeeOptions}>
        {domaines.map((d) => (
          <TouchableOpacity key={d.id} style={[styles.option, formulaire.domaine_id === d.id && styles.optionChoisie]} onPress={() => gererChangement('domaine_id', d.id)}>
            <Text style={formulaire.domaine_id === d.id ? styles.texteOptionChoisie : styles.texteOption}>{d.nom}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.libelleChamp}>Objet de la demande</Text>
      <TextInput style={styles.champ} value={formulaire.objet_demande} onChangeText={(t) => gererChangement('objet_demande', t)} multiline placeholder="Ex : achat d'intrants agricoles pour la campagne 2026" />

      <Text style={styles.libelleChamp}>Montant demandé (FCFA)</Text>
      <TextInput style={styles.champ} keyboardType="numeric" value={formulaire.montant_demande} onChangeText={(t) => gererChangement('montant_demande', t)} placeholder="Ex : 250000" />

      <View style={styles.rangee2Colonnes}>
        <View style={{ flex: 1 }}>
          <Text style={styles.libelleChamp}>Nb femmes</Text>
          <TextInput style={styles.champ} keyboardType="numeric" value={formulaire.nb_femmes_benef} onChangeText={(t) => gererChangement('nb_femmes_benef', t)} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.libelleChamp}>Nb hommes</Text>
          <TextInput style={styles.champ} keyboardType="numeric" value={formulaire.nb_hommes_benef} onChangeText={(t) => gererChangement('nb_hommes_benef', t)} />
        </View>
      </View>

      <Text style={styles.libelleChamp}>Résultat attendu</Text>
      <TextInput style={styles.champ} value={formulaire.resultat_attendu} onChangeText={(t) => gererChangement('resultat_attendu', t)} multiline placeholder="Ce que ce financement doit permettre d'accomplir" />

      <Text style={styles.libelleChamp}>Période prévisionnelle</Text>
      <TextInput style={styles.champ} value={formulaire.periode_previsionnelle} onChangeText={(t) => gererChangement('periode_previsionnelle', t)} placeholder="Ex : Août - Octobre 2026" />

      <Text style={styles.libelleChamp}>Site de travail</Text>
      <TextInput style={styles.champ} value={formulaire.site_travail} onChangeText={(t) => gererChangement('site_travail', t)} placeholder="Ex : Canton de Mororo" />

      <View style={styles.rangee2Colonnes}>
        <View style={{ flex: 1 }}>
          <Text style={styles.libelleChamp}>Co-financement en nature</Text>
          <TextInput style={styles.champ} value={formulaire.co_financement_en_nature} onChangeText={(t) => gererChangement('co_financement_en_nature', t)} placeholder="Ex : main d'œuvre" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.libelleChamp}>Co-financement en espèces (FCFA)</Text>
          <TextInput style={styles.champ} keyboardType="numeric" value={formulaire.co_financement_especes} onChangeText={(t) => gererChangement('co_financement_especes', t)} />
        </View>
      </View>

      <Text style={styles.sousTitre}>Bénéficiaires visés</Text>
      <Text style={styles.note}>La liste, sans montant à ce stade — juste pour que la Responsable sache qui sera concerné.</Text>

      {beneficiairesPrevus.map((bp, index) => (
        <View key={index} style={styles.ligneBeneficiairePrevu}>
          <Text style={styles.texteBeneficiairePrevu}>{bp.label}</Text>
          <TouchableOpacity onPress={() => retirerBeneficiaire(index)}>
            <Text style={styles.retirer}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}

      {modeAjout === null && (
        <View style={styles.rangee2Colonnes}>
          <TouchableOpacity style={styles.boutonSecondaire} onPress={() => setModeAjout('existant')}>
            <Text style={styles.texteBoutonSecondaire}>+ Bénéficiaire enregistré</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.boutonSecondaire} onPress={() => setModeAjout('libre')}>
            <Text style={styles.texteBoutonSecondaire}>+ Nouveau bénéficiaire</Text>
          </TouchableOpacity>
        </View>
      )}

      {modeAjout === 'existant' && (
        <View style={styles.formulaireAjout}>
          <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
            {beneficiairesExistants.map((b) => (
              <TouchableOpacity key={b.id} style={styles.optionBeneficiaire} onPress={() => ajouterBeneficiaireExistant(b)}>
                <Text style={styles.texteOption}>{b.nom} {b.prenom}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity onPress={() => setModeAjout(null)}><Text style={styles.annulerAjout}>Annuler</Text></TouchableOpacity>
        </View>
      )}

      {modeAjout === 'libre' && (
        <View style={styles.formulaireAjout}>
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

          {/* Photo et localisation : deux étapes optionnelles, volontairement
              compactes et rapides — le comité peut les ignorer sans que ça
              bloque la création du compte (connexion faible, urgence...). */}
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

          <View style={styles.actionsFormulaire}>
            <TouchableOpacity style={styles.boutonAnnuler} onPress={() => { setModeAjout(null); setNouveauBeneficiaire({ nom: '', prenom: '', sexe: 'F', telephone: '' }); setPhoto(null); setLocalisation(null); }}>
              <Text style={styles.texteBoutonAnnuler}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.boutonValider} onPress={creerEtAjouterBeneficiaire} disabled={creationEnCours}>
              {creationEnCours ? <ActivityIndicator color={couleurs.blanc} /> : <Text style={styles.texteBoutonValider}>Créer le compte et ajouter</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.boutonEnvoyer} onPress={gererEnvoi} disabled={envoiEnCours}>
        {envoiEnCours ? <ActivityIndicator color={couleurs.blanc} /> : <Text style={styles.texteBoutonEnvoyer}>Créer la demande</Text>}
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
  sousTitre: { fontSize: 15, fontWeight: '600', color: couleurs.grisTexte, marginTop: 24 },
  note: { fontSize: 12, color: '#888', marginBottom: 10 },
  ligneBeneficiairePrevu: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: couleurs.blanc, borderRadius: 8, padding: 12, marginBottom: 6 },
  texteBeneficiairePrevu: { color: couleurs.grisTexte, flex: 1 },
  retirer: { color: couleurs.brique, fontSize: 16, paddingHorizontal: 8 },
  boutonSecondaire: { flex: 1, borderWidth: 1, borderColor: couleurs.vertMoyen, borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 8 },
  texteBoutonSecondaire: { color: couleurs.vertMoyen, fontSize: 12, fontWeight: '600' },
  boutonOptionnel: {
    flex: 1, borderWidth: 1, borderColor: couleurs.grisClair, borderStyle: 'dashed', borderRadius: 8,
    padding: 10, alignItems: 'center', justifyContent: 'center', minHeight: 44,
  },
  texteBoutonOptionnel: { color: couleurs.grisTexte, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  miniaturePhoto: { width: 40, height: 40, borderRadius: 6 },
  formulaireAjout: { backgroundColor: couleurs.blanc, borderRadius: 10, padding: 14, marginTop: 10 },
  optionBeneficiaire: { padding: 10, borderRadius: 6, backgroundColor: couleurs.creme, marginBottom: 4 },
  annulerAjout: { color: couleurs.brique, textAlign: 'center', marginTop: 8, fontSize: 13 },
  actionsFormulaire: { flexDirection: 'row', gap: 10, marginTop: 12 },
  boutonAnnuler: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: couleurs.grisClair },
  texteBoutonAnnuler: { color: couleurs.grisTexte },
  boutonValider: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8, backgroundColor: couleurs.vertMoyen },
  texteBoutonValider: { color: couleurs.blanc, fontWeight: '600' },
  boutonEnvoyer: { backgroundColor: couleurs.vertFonce, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 28 },
  texteBoutonEnvoyer: { color: couleurs.blanc, fontWeight: '700', fontSize: 15 },
});
