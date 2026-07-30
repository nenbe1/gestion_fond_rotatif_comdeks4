import { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import appelerApi from '../../api/client';
import { couleurs } from '../../theme/couleurs';

export default function ListeFinancementsScreen({ navigation }) {
  const [financements, setFinancements] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  const charger = useCallback(async () => {
    try {
      const donnees = await appelerApi('/financements');
      setFinancements(donnees.financements);
      setErreur('');
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  return (
    <FlatList
      style={styles.conteneur}
      contentContainerStyle={styles.contenu}
      data={financements}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={chargement} onRefresh={charger} />}
      ListEmptyComponent={!chargement ? <Text style={styles.vide}>{erreur || 'Aucun financement pour l\'instant.'}</Text> : null}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.carte}
          onPress={() => navigation.navigate('DetailFinancementRemboursements', {
            financementId: item.id,
            codeFinancement: item.codeFinancement,
            montantFinancement: item.montantFinancement,
          })}
        >
          <Text style={styles.code}>{item.codeFinancement}</Text>
          <Text style={styles.montant}>{Number(item.montantFinancement).toLocaleString('fr-FR')} FCFA</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.creme },
  contenu: { padding: 20 },
  vide: { textAlign: 'center', color: '#888', marginTop: 20 },
  carte: { backgroundColor: couleurs.blanc, borderRadius: 10, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between' },
  code: { fontWeight: '700', color: couleurs.grisTexte },
  montant: { fontWeight: '600', color: couleurs.vertMoyen },
});
