import { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import appelerApi from '../../api/client';
import { couleurs } from '../../theme/couleurs';

/**
 * Liste des groupes MMF de mon canton, avec création rapide. Un groupe
 * est toujours rattaché au canton du membre du comité qui le crée
 * (jamais choisi manuellement — même logique que Bénéficiaire).
 */
export default function ListeGroupesScreen({ navigation }) {
  const [groupes, setGroupes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [nom, setNom] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const charger = useCallback(async () => {
    try {
      const donnees = await appelerApi('/groupes-mmf');
      setGroupes(donnees.groupes);
      setErreur('');
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  async function gererCreation() {
    if (!nom.trim()) {
      Alert.alert('Erreur', 'Le nom du groupe est requis.');
      return;
    }
    setEnvoiEnCours(true);
    try {
      await appelerApi('/groupes-mmf', { method: 'POST', body: { nom } });
      setNom('');
      setAfficherFormulaire(false);
      await charger();
    } catch (err) {
      Alert.alert('Erreur', err.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <FlatList
      style={styles.conteneur}
      contentContainerStyle={styles.contenu}
      data={groupes}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={chargement} onRefresh={charger} />}
      ListHeaderComponent={
        <View>
          {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

          {afficherFormulaire ? (
            <View style={styles.formulaire}>
              <TextInput
                style={styles.champ}
                value={nom}
                onChangeText={setNom}
                placeholder="Nom du groupe"
                autoFocus
              />
              <View style={styles.actionsFormulaire}>
                <TouchableOpacity style={styles.boutonAnnuler} onPress={() => { setAfficherFormulaire(false); setNom(''); }}>
                  <Text style={styles.texteBoutonAnnuler}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.boutonValider} onPress={gererCreation} disabled={envoiEnCours}>
                  {envoiEnCours ? <ActivityIndicator color={couleurs.blanc} /> : <Text style={styles.texteBoutonValider}>Créer</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.boutonAjouter} onPress={() => setAfficherFormulaire(true)}>
              <Text style={styles.texteBoutonAjouter}>+ Nouveau groupe</Text>
            </TouchableOpacity>
          )}
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.carte}
          onPress={() => navigation.navigate('DetailGroupe', { groupeId: item.id, nomGroupe: item.nom })}
          activeOpacity={0.85}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.nomGroupe}>{item.nom}</Text>
            <Text style={styles.infoGroupe}>
              {item.nombreMembres} membre{item.nombreMembres > 1 ? 's' : ''}
              {item.responsableNom ? ` · Resp. ${item.responsableNom} ${item.responsablePrenom}` : ' · Pas de responsable'}
            </Text>
          </View>
          {!item.actif && <Text style={styles.badgeInactif}>Désactivé</Text>}
        </TouchableOpacity>
      )}
      ListEmptyComponent={!chargement ? <Text style={styles.vide}>Aucun groupe pour l'instant.</Text> : null}
    />
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.creme },
  contenu: { padding: 20 },
  erreur: { color: couleurs.brique, marginBottom: 12 },
  boutonAjouter: { backgroundColor: couleurs.vertFonce, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  texteBoutonAjouter: { color: couleurs.blanc, fontWeight: '700' },
  formulaire: { backgroundColor: couleurs.blanc, borderRadius: 12, padding: 14, marginBottom: 16 },
  champ: { borderWidth: 1, borderColor: couleurs.grisClair, borderRadius: 8, padding: 10, fontSize: 15 },
  actionsFormulaire: { flexDirection: 'row', gap: 10, marginTop: 12 },
  boutonAnnuler: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: couleurs.grisClair },
  texteBoutonAnnuler: { color: couleurs.grisTexte },
  boutonValider: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8, backgroundColor: couleurs.vertMoyen },
  texteBoutonValider: { color: couleurs.blanc, fontWeight: '600' },
  carte: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: couleurs.blanc, borderRadius: 12, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  nomGroupe: { fontSize: 15, fontWeight: '700', color: couleurs.grisTexte },
  infoGroupe: { fontSize: 12, color: '#888', marginTop: 4 },
  badgeInactif: { fontSize: 10, color: couleurs.brique, fontWeight: '600' },
  vide: { textAlign: 'center', color: '#888', marginTop: 20 },
});
