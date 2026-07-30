import { useCallback, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import appelerApi from '../../api/client';
import { couleurs } from '../../theme/couleurs';

const LIBELLE_STATUT = { EnAttente: 'Circuit en cours', Confirme: 'Confirmé', Rejete: 'Rejeté' };
const COULEUR_STATUT = { EnAttente: couleurs.bleuAttente, Confirme: couleurs.vertMoyen, Rejete: couleurs.brique };

export default function DetailFinancementRemboursementsScreen({ route, navigation }) {
  const { financementId, codeFinancement, montantFinancement } = route.params;
  const [remboursements, setRemboursements] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [numeroSemaine, setNumeroSemaine] = useState('');
  const [montantPrevu, setMontantPrevu] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const charger = useCallback(async () => {
    try {
      const donnees = await appelerApi(`/remboursements/collectif/financement/${financementId}`);
      setRemboursements(donnees.remboursements);
      setErreur('');
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }, [financementId]);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  async function gererAjout() {
    if (!numeroSemaine || Number(numeroSemaine) < 1) {
      Alert.alert('Erreur', 'Entrez un numéro de semaine valide.');
      return;
    }
    if (!montantPrevu || Number(montantPrevu) <= 0) {
      Alert.alert('Erreur', 'Entrez un montant prévu valide.');
      return;
    }
    setEnvoiEnCours(true);
    try {
      await appelerApi('/remboursements/collectif', {
        method: 'POST',
        body: {
          financement_id: financementId,
          numero_semaine: Number(numeroSemaine),
          date_prevue: new Date().toISOString().slice(0, 10),
          montant_prevu: Number(montantPrevu),
        },
      });
      setNumeroSemaine('');
      setMontantPrevu('');
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
      data={remboursements}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={chargement} onRefresh={charger} />}
      ListHeaderComponent={
        <View>
          <Text style={styles.code}>{codeFinancement}</Text>
          <Text style={styles.montant}>{Number(montantFinancement).toLocaleString('fr-FR')} FCFA financés</Text>

          {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

          {!afficherFormulaire ? (
            <TouchableOpacity style={styles.boutonAjouter} onPress={() => setAfficherFormulaire(true)}>
              <Text style={styles.texteBoutonAjouter}>+ Nouveau remboursement de la semaine</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.formulaire}>
              <Text style={styles.libelleChamp}>Numéro de semaine</Text>
              <TextInput style={styles.champ} keyboardType="numeric" value={numeroSemaine} onChangeText={setNumeroSemaine} placeholder="Ex : 1" />
              <Text style={styles.libelleChamp}>Montant prévu (FCFA)</Text>
              <TextInput style={styles.champ} keyboardType="numeric" value={montantPrevu} onChangeText={setMontantPrevu} placeholder="Ex : 11000" />
              <View style={styles.actionsFormulaire}>
                <TouchableOpacity style={styles.boutonAnnuler} onPress={() => setAfficherFormulaire(false)}>
                  <Text style={styles.texteBoutonAnnuler}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.boutonValider} onPress={gererAjout} disabled={envoiEnCours}>
                  {envoiEnCours ? <ActivityIndicator color={couleurs.blanc} /> : <Text style={styles.texteBoutonValider}>Créer</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={styles.sousTitreListe}>Semaines de remboursement</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.ligne}
          onPress={() => navigation.navigate('DetailCircuitRemboursementCollectif', { remboursementCollectifId: item.id, numeroSemaine: item.numeroSemaine })}
        >
          <View>
            <Text style={styles.semaine}>Semaine {item.numeroSemaine}</Text>
            <Text style={styles.montantLigne}>{Number(item.montantPrevu).toLocaleString('fr-FR')} FCFA prévus</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: COULEUR_STATUT[item.statut] || '#ccc' }]}>
            <Text style={styles.texteBadge}>{LIBELLE_STATUT[item.statut] || item.statut}</Text>
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={!chargement ? <Text style={styles.vide}>Aucun remboursement enregistré pour l'instant.</Text> : null}
    />
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.creme },
  contenu: { padding: 20 },
  code: { fontSize: 14, color: '#888' },
  montant: { fontSize: 16, fontWeight: '600', color: couleurs.vertMoyen, marginTop: 4, marginBottom: 16 },
  erreur: { color: couleurs.brique, marginBottom: 12 },
  boutonAjouter: { backgroundColor: couleurs.vertFonce, borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 20 },
  texteBoutonAjouter: { color: couleurs.blanc, fontWeight: '600' },
  formulaire: { backgroundColor: couleurs.blanc, borderRadius: 10, padding: 14, marginBottom: 20 },
  libelleChamp: { fontSize: 13, color: couleurs.grisTexte, marginTop: 8, marginBottom: 4 },
  champ: { borderWidth: 1, borderColor: couleurs.grisClair, borderRadius: 8, padding: 10, fontSize: 15 },
  actionsFormulaire: { flexDirection: 'row', gap: 10, marginTop: 12 },
  boutonAnnuler: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: couleurs.grisClair },
  texteBoutonAnnuler: { color: couleurs.grisTexte },
  boutonValider: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8, backgroundColor: couleurs.vertMoyen },
  texteBoutonValider: { color: couleurs.blanc, fontWeight: '600' },
  sousTitreListe: { fontSize: 15, fontWeight: '600', color: couleurs.grisTexte, marginBottom: 8 },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: couleurs.blanc, borderRadius: 8, padding: 14, marginBottom: 8 },
  semaine: { fontWeight: '600', color: couleurs.grisTexte },
  montantLigne: { fontSize: 12, color: '#888', marginTop: 2 },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  texteBadge: { color: couleurs.blanc, fontSize: 10, fontWeight: '600' },
  vide: { textAlign: 'center', color: '#888', marginTop: 10 },
});
