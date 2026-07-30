import { useCallback, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import appelerApi from '../../api/client';
import { couleurs } from '../../theme/couleurs';

/**
 * Détail des remboursements d'un financement reçu par le bénéficiaire.
 * Le remboursement individuel n'a pas de circuit de validation (voir
 * remboursement.service.js côté backend : "le bénéficiaire a déjà remis
 * l'argent au comité avant l'enregistrement, c'est un fait accompli") —
 * donc pas d'étapes à approuver ici, juste un historique + ajout.
 */
export default function DetailFinancementScreen({ route }) {
  const { attributionId, montantAttribue, codeFinancement } = route.params;
  const [remboursements, setRemboursements] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [montant, setMontant] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const charger = useCallback(async () => {
    try {
      const donnees = await appelerApi(`/remboursements/individuel/attribution/${attributionId}`);
      setRemboursements(donnees.remboursements);
      setErreur('');
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }, [attributionId]);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  const totalRembourse = remboursements.reduce((somme, r) => somme + Number(r.montant), 0);
  const resteAPayer = Math.max(Number(montantAttribue) - totalRembourse, 0);

  async function gererAjout() {
    if (!montant || Number(montant) <= 0) {
      Alert.alert('Erreur', 'Entrez un montant valide.');
      return;
    }
    setEnvoiEnCours(true);
    try {
      await appelerApi('/remboursements/individuel', {
        method: 'POST',
        body: {
          attribution_financement_id: attributionId,
          montant: Number(montant),
          date_versement: new Date().toISOString().slice(0, 10),
        },
      });
      setMontant('');
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

          <View style={styles.grilleCartes}>
            <View style={styles.carteStat}>
              <Text style={styles.valeurStat}>{Number(montantAttribue).toLocaleString('fr-FR')}</Text>
              <Text style={styles.libelleStat}>FCFA reçus</Text>
            </View>
            <View style={styles.carteStat}>
              <Text style={[styles.valeurStat, { color: couleurs.brique }]}>{resteAPayer.toLocaleString('fr-FR')}</Text>
              <Text style={styles.libelleStat}>FCFA restant (majoration 10% incluse)</Text>
            </View>
          </View>

          {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

          {!afficherFormulaire ? (
            <TouchableOpacity style={styles.boutonAjouter} onPress={() => setAfficherFormulaire(true)}>
              <Text style={styles.texteBoutonAjouter}>+ Enregistrer un remboursement</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.formulaire}>
              <Text style={styles.libelleChamp}>Montant versé aujourd'hui (FCFA)</Text>
              <TextInput
                style={styles.champ}
                keyboardType="numeric"
                value={montant}
                onChangeText={setMontant}
                placeholder="Ex : 5000"
              />
              <View style={styles.actionsFormulaire}>
                <TouchableOpacity style={styles.boutonAnnuler} onPress={() => setAfficherFormulaire(false)}>
                  <Text style={styles.texteBoutonAnnuler}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.boutonValider} onPress={gererAjout} disabled={envoiEnCours}>
                  {envoiEnCours ? <ActivityIndicator color={couleurs.blanc} /> : <Text style={styles.texteBoutonValider}>Valider</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={styles.sousTitreListe}>Historique des remboursements</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.ligne}>
          <Text style={styles.dateLigne}>{new Date(item.dateVersement).toLocaleDateString('fr-FR')}</Text>
          <Text style={styles.montantLigne}>{Number(item.montant).toLocaleString('fr-FR')} FCFA</Text>
        </View>
      )}
      ListEmptyComponent={!chargement ? <Text style={styles.vide}>Aucun remboursement enregistré pour l'instant.</Text> : null}
    />
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.creme },
  contenu: { padding: 20 },
  code: { fontSize: 14, color: '#888', marginBottom: 10 },
  grilleCartes: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  carteStat: { flex: 1, backgroundColor: couleurs.blanc, borderRadius: 10, padding: 12, alignItems: 'center' },
  valeurStat: { fontSize: 16, fontWeight: '700', color: couleurs.vertFonce, textAlign: 'center' },
  libelleStat: { fontSize: 11, color: '#888', textAlign: 'center', marginTop: 4 },
  erreur: { color: couleurs.brique, marginBottom: 12 },
  boutonAjouter: { backgroundColor: couleurs.vertFonce, borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 20 },
  texteBoutonAjouter: { color: couleurs.blanc, fontWeight: '600' },
  formulaire: { backgroundColor: couleurs.blanc, borderRadius: 10, padding: 14, marginBottom: 20 },
  libelleChamp: { fontSize: 13, color: couleurs.grisTexte, marginBottom: 6 },
  champ: { borderWidth: 1, borderColor: couleurs.grisClair, borderRadius: 8, padding: 10, fontSize: 15 },
  actionsFormulaire: { flexDirection: 'row', gap: 10, marginTop: 12 },
  boutonAnnuler: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: couleurs.grisClair },
  texteBoutonAnnuler: { color: couleurs.grisTexte },
  boutonValider: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8, backgroundColor: couleurs.vertMoyen },
  texteBoutonValider: { color: couleurs.blanc, fontWeight: '600' },
  sousTitreListe: { fontSize: 15, fontWeight: '600', color: couleurs.grisTexte, marginBottom: 8 },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: couleurs.blanc, borderRadius: 8, padding: 14, marginBottom: 8 },
  dateLigne: { color: couleurs.grisTexte },
  montantLigne: { fontWeight: '700', color: couleurs.vertMoyen },
  vide: { textAlign: 'center', color: '#888', marginTop: 10 },
});
