import { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import appelerApi from '../../api/client';
import { couleurs } from '../../theme/couleurs';

/**
 * Liste des bénéficiaires de mon canton (comité), avec Modifier
 * (âge estimé / activité) et Supprimer. Même route backend que le Web
 * (PUT/DELETE /beneficiaires/:id), réservée au comité ET à la
 * Responsable.
 */
export default function ListeBeneficiairesScreen() {
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [idEnEdition, setIdEnEdition] = useState(null);
  const [ageEdition, setAgeEdition] = useState('');
  const [activiteEdition, setActiviteEdition] = useState('');
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
    setAgeEdition(b.ageEstime ? String(b.ageEstime) : '');
    setActiviteEdition(b.activite || '');
  }

  async function enregistrerEdition(b) {
    setEnvoiEnCours(true);
    try {
      await appelerApi(`/beneficiaires/${b.id}`, {
        method: 'PUT',
        body: { age_estime: ageEdition, activite: activiteEdition, latitude: b.latitude, longitude: b.longitude },
      });
      setIdEnEdition(null);
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
      ListEmptyComponent={!chargement ? <Text style={styles.vide}>{erreur || "Aucun bénéficiaire pour l'instant."}</Text> : null}
      renderItem={({ item }) => (
        <View style={styles.carte}>
          <View style={styles.entete}>
            <Text style={styles.nom}>{item.nom} {item.prenom}</Text>
            <Text style={styles.statut}>{item.statutMMF}</Text>
          </View>
          <Text style={styles.telephone}>{item.telephone}</Text>

          {idEnEdition === item.id ? (
            <View>
              <Text style={styles.libelleChamp}>Âge estimé</Text>
              <TextInput style={styles.champ} keyboardType="numeric" value={ageEdition} onChangeText={setAgeEdition} />
              <Text style={styles.libelleChamp}>Activité</Text>
              <TextInput style={styles.champ} value={activiteEdition} onChangeText={setActiviteEdition} />
              <View style={styles.actions}>
                <TouchableOpacity style={styles.boutonPrincipal} disabled={envoiEnCours} onPress={() => enregistrerEdition(item)}>
                  <Text style={styles.texteBouton}>{envoiEnCours ? 'Enregistrement...' : 'Enregistrer'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.boutonSecondaire} onPress={() => setIdEnEdition(null)}>
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
  vide: { textAlign: 'center', color: '#888', marginTop: 20 },
  carte: { backgroundColor: couleurs.blanc, borderRadius: 10, padding: 14, marginBottom: 10 },
  entete: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  nom: { fontWeight: '700', color: couleurs.grisTexte, fontSize: 15 },
  statut: { color: couleurs.vertMoyen, fontWeight: '600', fontSize: 12 },
  telephone: { color: '#666', fontSize: 13, marginBottom: 8 },
  infoLigne: { color: couleurs.grisTexte, fontSize: 13, marginBottom: 2 },
  libelleChamp: { color: '#666', fontSize: 12, marginTop: 6, marginBottom: 2 },
  champ: { borderWidth: 1, borderColor: couleurs.grisClair, borderRadius: 8, padding: 8, backgroundColor: couleurs.creme },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  boutonPrincipal: { backgroundColor: couleurs.vertFonce, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  boutonSecondaire: { backgroundColor: couleurs.grisClair, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  boutonDanger: { backgroundColor: couleurs.brique, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  texteBouton: { color: couleurs.blanc, fontWeight: '600', fontSize: 13 },
  texteBoutonSecondaire: { color: couleurs.grisTexte, fontWeight: '600', fontSize: 13 },
});
