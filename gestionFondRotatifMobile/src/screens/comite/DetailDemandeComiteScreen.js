import { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import appelerApi from '../../api/client';
import { couleurs } from '../../theme/couleurs';

const LIBELLE_NIVEAU = { TRESORIER: 'Trésorier', COMMISSAIRE: 'Commissaire aux comptes', PRESIDENT: 'Président du comité' };
const LIBELLE_STATUT_ETAPE = { EnAttente: 'En attente', Approuve: 'Approuvé', Rejete: 'Rejeté' };

export default function DetailDemandeComiteScreen({ route }) {
  const { demandeId } = route.params;
  const [demande, setDemande] = useState(null);
  const [circuit, setCircuit] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [traitementEnCours, setTraitementEnCours] = useState(false);

  const charger = useCallback(async () => {
    try {
      const [d, v] = await Promise.all([
        appelerApi(`/demandes-financement/${demandeId}`),
        appelerApi(`/validations/demande/${demandeId}`),
      ]);
      setDemande(d.demande);
      setCircuit(v.circuit);
      setErreur('');
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }, [demandeId]);

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
    Alert.alert(
      `Confirmer`,
      `Voulez-vous vraiment ${libelle} cette étape ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', style: decision === 'Rejete' ? 'destructive' : 'default', onPress: () => traiter(validationId, decision) },
      ]
    );
  }

  // La première étape "EnAttente" dont la précédente est déjà Approuve
  // (ou qui est la première) est la seule qui peut être traitée
  // maintenant — même règle que côté backend.
  function etapeTraitableMaintenant(etape, index) {
    if (etape.statut !== 'EnAttente') return false;
    if (index === 0) return true;
    return circuit[index - 1]?.statut === 'Approuve';
  }

  if (chargement) return <ActivityIndicator style={{ marginTop: 40 }} color={couleurs.vertFonce} />;
  if (erreur) return <Text style={styles.erreur}>{erreur}</Text>;
  if (!demande) return null;

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      <Text style={styles.code}>{demande.codeDemande}</Text>
      <Text style={styles.objet}>{demande.objetDemande}</Text>
      <Text style={styles.montant}>{Number(demande.montantDemande).toLocaleString('fr-FR')} FCFA</Text>
      {demande.resultatAttendu ? <Text style={styles.detail}>Résultat attendu : {demande.resultatAttendu}</Text> : null}
      {demande.siteTravail ? <Text style={styles.detail}>Site : {demande.siteTravail}</Text> : null}

      <Text style={styles.sousTitre}>Circuit de validation</Text>
      {circuit.map((etape, index) => (
        <View key={etape.id} style={styles.etape}>
          <View style={{ flex: 1 }}>
            <Text style={styles.niveau}>{LIBELLE_NIVEAU[etape.niveau] || etape.niveau}</Text>
            <Text style={styles.statutEtape}>{LIBELLE_STATUT_ETAPE[etape.statut] || etape.statut}</Text>
          </View>
          {etapeTraitableMaintenant(etape, index) && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.boutonAction, styles.boutonApprouver]}
                disabled={traitementEnCours}
                onPress={() => confirmerTraitement(etape.id, 'Approuve')}
              >
                <Text style={styles.texteBoutonAction}>Approuver</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.boutonAction, styles.boutonRejeter]}
                disabled={traitementEnCours}
                onPress={() => confirmerTraitement(etape.id, 'Rejete')}
              >
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
  code: { fontSize: 13, color: '#888' },
  objet: { fontSize: 18, fontWeight: '700', color: couleurs.grisTexte, marginTop: 4 },
  montant: { fontSize: 16, fontWeight: '600', color: couleurs.vertMoyen, marginTop: 6 },
  detail: { fontSize: 13, color: '#555', marginTop: 8 },
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
