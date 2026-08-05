import { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import appelerApi from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { couleurs } from '../../theme/couleurs';

const LIBELLE_NIVEAU = { TRESORIER: 'Trésorier', COMMISSAIRE: 'Commissaire aux comptes', PRESIDENT: 'Président du comité' };
const LIBELLE_STATUT_ETAPE = { EnAttente: 'En attente', Approuve: 'Approuvé', Rejete: 'Rejeté' };

/**
 * Contrairement au circuit d'une demande de financement, l'approbation
 * de la dernière étape ici confirme directement le paiement et crédite
 * le fonds (pas de droit de veto de la Responsable pour ce cas — voir
 * remboursement.service.confirmerApresValidation côté backend).
 */
export default function DetailCircuitRemboursementCollectifScreen({ route }) {
  const { remboursementCollectifId, numeroSemaine } = route.params;
  const { utilisateur } = useAuth();
  const [remboursement, setRemboursement] = useState(null);
  const [circuit, setCircuit] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [traitementEnCours, setTraitementEnCours] = useState(false);

  const charger = useCallback(async () => {
    try {
      const [r, v] = await Promise.all([
        appelerApi(`/remboursements/collectif/${remboursementCollectifId}`),
        appelerApi(`/validations/remboursement-collectif/${remboursementCollectifId}`),
      ]);
      setRemboursement(r.remboursement);
      setCircuit(v.circuit);
      setErreur('');
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }, [remboursementCollectifId]);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  async function traiter(validationId, decision) {
    setTraitementEnCours(true);
    try {
      await appelerApi(`/validations/${validationId}/traiter`, { method: 'PUT', body: { decision } });
      await charger();
    } catch (err) {
      Alert.alert('Erreur', err.message);
    } finally {
      setTraitementEnCours(false);
    }
  }

  function confirmerTraitement(validationId, decision) {
    const libelle = decision === 'Approuve' ? 'approuver' : 'rejeter';
    Alert.alert('Confirmer', `Voulez-vous vraiment ${libelle} cette étape ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', style: decision === 'Rejete' ? 'destructive' : 'default', onPress: () => traiter(validationId, decision) },
    ]);
  }

  function etapeTraitableMaintenant(etape, index) {
    if (etape.statut !== 'EnAttente') return false;
    if (etape.niveau !== utilisateur?.fonctionCode) return false; // pas sa fonction, pas à lui de traiter
    if (index === 0) return true;
    return circuit[index - 1]?.statut === 'Approuve';
  }

  if (chargement) return <ActivityIndicator style={{ marginTop: 40 }} color={couleurs.vertFonce} />;
  if (erreur) return <Text style={styles.erreur}>{erreur}</Text>;
  if (!remboursement) return null;

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      <Text style={styles.titre}>Semaine {numeroSemaine}</Text>
      <Text style={styles.montant}>{Number(remboursement.montantPrevu).toLocaleString('fr-FR')} FCFA prévus</Text>
      {remboursement.statut === 'Confirme' && (
        <Text style={styles.confirme}>✓ Confirmé — {Number(remboursement.montantVerse).toLocaleString('fr-FR')} FCFA versés au fonds</Text>
      )}
      {remboursement.statut === 'Rejete' && <Text style={styles.rejete}>✕ Rejeté par le comité</Text>}

      <Text style={styles.sousTitre}>Circuit de validation</Text>
      {circuit.map((etape, index) => (
        <View key={etape.id} style={styles.etape}>
          <View style={{ flex: 1 }}>
            <Text style={styles.niveau}>{LIBELLE_NIVEAU[etape.niveau] || etape.niveau}</Text>
            <Text style={styles.statutEtape}>{LIBELLE_STATUT_ETAPE[etape.statut] || etape.statut}</Text>
          </View>
          {etapeTraitableMaintenant(etape, index) && (
            <View style={styles.actions}>
              <TouchableOpacity style={[styles.boutonAction, styles.boutonApprouver]} disabled={traitementEnCours} onPress={() => confirmerTraitement(etape.id, 'Approuve')}>
                <Text style={styles.texteBoutonAction}>Approuver</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.boutonAction, styles.boutonRejeter]} disabled={traitementEnCours} onPress={() => confirmerTraitement(etape.id, 'Rejete')}>
                <Text style={styles.texteBoutonAction}>Rejeter</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.creme },
  contenu: { padding: 20 },
  erreur: { color: couleurs.brique, textAlign: 'center', marginTop: 40 },
  titre: { fontSize: 18, fontWeight: '700', color: couleurs.grisTexte },
  montant: { fontSize: 16, fontWeight: '600', color: couleurs.vertMoyen, marginTop: 6 },
  confirme: { color: couleurs.vertMoyen, marginTop: 10, fontWeight: '600' },
  rejete: { color: couleurs.brique, marginTop: 10, fontWeight: '600' },
  sousTitre: { fontSize: 15, fontWeight: '600', color: couleurs.grisTexte, marginTop: 24, marginBottom: 10 },
  etape: { flexDirection: 'row', alignItems: 'center', backgroundColor: couleurs.blanc, borderRadius: 10, padding: 14, marginBottom: 10 },
  niveau: { fontWeight: '600', color: couleurs.grisTexte },
  statutEtape: { fontSize: 12, color: '#888', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  boutonAction: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8 },
  boutonApprouver: { backgroundColor: couleurs.vertMoyen },
  boutonRejeter: { backgroundColor: couleurs.brique },
  texteBoutonAction: { color: couleurs.blanc, fontSize: 12, fontWeight: '600' },
});
