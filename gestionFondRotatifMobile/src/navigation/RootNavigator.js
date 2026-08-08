import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { couleurs } from '../theme/couleurs';

import ConnexionScreen from '../screens/ConnexionScreen';
import TableauDeBordComiteScreen from '../screens/comite/TableauDeBordComiteScreen';
import CreerDemandeScreen from '../screens/comite/CreerDemandeScreen';
import DetailDemandeComiteScreen from '../screens/comite/DetailDemandeComiteScreen';
import ListeFinancementsScreen from '../screens/comite/ListeFinancementsScreen';
import ListeBeneficiairesScreen from '../screens/comite/ListeBeneficiairesScreen';
import DetailFinancementComiteScreen from '../screens/comite/DetailFinancementComiteScreen';
import DetailFinancementRemboursementsScreen from '../screens/comite/DetailFinancementRemboursementsScreen';
import DetailCircuitRemboursementCollectifScreen from '../screens/comite/DetailCircuitRemboursementCollectifScreen';
import MonCompteScreen from '../screens/beneficiaire/MonCompteScreen';
import DetailFinancementScreen from '../screens/beneficiaire/DetailFinancementScreen';
import ConseillerIAScreen from '../screens/beneficiaire/ConseillerIAScreen';

const Stack = createNativeStackNavigator();

/** Pile de navigation du comité : liste des demandes -> détail + traitement. */
function PileComite() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: couleurs.vertFonce }, headerTintColor: couleurs.blanc }}>
      <Stack.Screen name="TableauDeBord" component={TableauDeBordComiteScreen} options={{ title: 'Demandes de financement' }} />
      <Stack.Screen name="CreerDemande" component={CreerDemandeScreen} options={{ title: 'Nouvelle demande' }} />
      <Stack.Screen name="DetailDemande" component={DetailDemandeComiteScreen} options={{ title: 'Détail de la demande' }} />
      <Stack.Screen name="ListeFinancements" component={ListeFinancementsScreen} options={{ title: 'Remboursements collectifs' }} />
      <Stack.Screen name="ListeBeneficiaires" component={ListeBeneficiairesScreen} options={{ title: 'Bénéficiaires' }} />
      <Stack.Screen name="DetailFinancementComite" component={DetailFinancementComiteScreen} options={{ title: 'Répartition du financement' }} />
      <Stack.Screen name="DetailFinancementRemboursements" component={DetailFinancementRemboursementsScreen} options={{ title: 'Détail du financement' }} />
      <Stack.Screen name="DetailCircuitRemboursementCollectif" component={DetailCircuitRemboursementCollectifScreen} options={{ title: 'Circuit de validation' }} />
    </Stack.Navigator>
  );
}

/** Pile de navigation du bénéficiaire : son compte, et le détail des remboursements par financement. */
function PileBeneficiaire() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: couleurs.vertFonce }, headerTintColor: couleurs.blanc }}>
      <Stack.Screen name="MonCompte" component={MonCompteScreen} options={{ title: 'Mon compte' }} />
      <Stack.Screen name="DetailFinancement" component={DetailFinancementScreen} options={{ title: 'Détail du financement' }} />
      <Stack.Screen name="ConseillerIA" component={ConseillerIAScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

/**
 * Rôles non pris en charge par le Mobile (Responsable, Autorité,
 * Indéterminé) : on affiche un message clair plutôt qu'un écran vide,
 * ils sont censés utiliser la plateforme Web.
 */
function AccesNonPrisEnCharge({ deconnecter }) {
  return (
    <View style={styles.centre}>
      <Text style={styles.messageAcces}>Ce type de compte utilise la plateforme Web, pas l'application Mobile.</Text>
      <Text onPress={deconnecter} style={styles.lienDeconnexion}>Se déconnecter</Text>
    </View>
  );
}

export default function RootNavigator() {
  const { utilisateur, enChargement, deconnecter } = useAuth();

  if (enChargement) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator size="large" color={couleurs.vertFonce} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!utilisateur ? (
        <ConnexionScreen />
      ) : utilisateur.role === 'MEMBRE_COMITE' ? (
        <PileComite />
      ) : utilisateur.role === 'BENEFICIAIRE' ? (
        <PileBeneficiaire />
      ) : (
        <AccesNonPrisEnCharge deconnecter={deconnecter} />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  centre: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: couleurs.creme, padding: 24 },
  messageAcces: { textAlign: 'center', color: couleurs.grisTexte, fontSize: 15, marginBottom: 16 },
  lienDeconnexion: { color: couleurs.brique, fontSize: 14 },
});
