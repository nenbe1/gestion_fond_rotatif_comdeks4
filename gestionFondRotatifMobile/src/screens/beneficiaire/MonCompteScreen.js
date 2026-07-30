import { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import appelerApi from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { couleurs } from '../../theme/couleurs';

const LIBELLE_STATUT = {
  Nouveau: 'Nouveau',
  RemboursementEnCours: 'Remboursement en cours',
  Solde: 'Soldé',
};

export default function MonCompteScreen() {
  const [compte, setCompte] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const { utilisateur, deconnecter } = useAuth();

  const charger = useCallback(async () => {
    try {
      const donnees = await appelerApi('/beneficiaires/moi/compte');
      setCompte(donnees.compte);
      setErreur('');
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }, []);

  // Recharge à chaque retour sur l'écran (ex: après qu'un nouveau
  // financement lui ait été attribué entre-temps par la Responsable).
  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  const situation = compte?.situation;
  const resteDu = situation ? Math.max(situation.totalAttribue * 1.10 - situation.totalRembourse, 0) : 0;

  return (
    <FlatList
      style={styles.conteneur}
      contentContainerStyle={styles.contenu}
      data={compte?.financements ?? []}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={chargement} onRefresh={charger} />}
      ListHeaderComponent={
        <View>
          <View style={styles.entete}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.nom}>{utilisateur?.nom} {utilisateur?.prenom}</Text>
              {compte?.beneficiaire && (
                <View style={[styles.badge, styleBadge(compte.beneficiaire.statutMMF)]}>
                  <Text style={styles.texteBadge}>{LIBELLE_STATUT[compte.beneficiaire.statutMMF] || compte.beneficiaire.statutMMF}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={deconnecter}><Text style={styles.deconnexion}>Déconnexion</Text></TouchableOpacity>
          </View>

          {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

          {situation && (
            <View style={styles.grilleCartes}>
              <View style={styles.carteStat}>
                <Text style={styles.valeurStat}>{situation.nombreFinancements}</Text>
                <Text style={styles.libelleStat}>Financements reçus</Text>
              </View>
              <View style={styles.carteStat}>
                <Text style={styles.valeurStat}>{situation.totalAttribue.toLocaleString('fr-FR')}</Text>
                <Text style={styles.libelleStat}>FCFA reçus au total</Text>
              </View>
              <View style={styles.carteStat}>
                <Text style={[styles.valeurStat, { color: couleurs.brique }]}>{resteDu.toLocaleString('fr-FR')}</Text>
                <Text style={styles.libelleStat}>FCFA restant à rembourser</Text>
              </View>
            </View>
          )}

          <Text style={styles.sousTitreListe}>Mes financements</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.ligneFinancement}>
          <View>
            <Text style={styles.codeFinancement}>{item.codeFinancement}</Text>
            <Text style={styles.dateFinancement}>
              {new Date(item.dateAttribution).toLocaleDateString('fr-FR')}
            </Text>
          </View>
          <Text style={styles.montantFinancement}>{item.montantAttribue.toLocaleString('fr-FR')} FCFA</Text>
        </View>
      )}
      ListEmptyComponent={!chargement ? <Text style={styles.vide}>Aucun financement reçu pour l'instant.</Text> : null}
    />
  );
}

function styleBadge(statut) {
  if (statut === 'Solde') return { backgroundColor: '#e6f2ea' };
  if (statut === 'RemboursementEnCours') return { backgroundColor: '#fdf3e0' };
  return { backgroundColor: '#eef1f6' };
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.creme },
  contenu: { padding: 20 },
  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  nom: { flexShrink: 1, fontSize: 20, fontWeight: '700', color: couleurs.vertFonce, marginRight: 10 },
  badge: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6 },
  texteBadge: { fontSize: 12, color: couleurs.grisTexte },
  deconnexion: { color: couleurs.brique, fontSize: 13 },
  erreur: { color: couleurs.brique, marginBottom: 12 },
  grilleCartes: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  carteStat: { flex: 1, backgroundColor: couleurs.blanc, borderRadius: 10, padding: 12, alignItems: 'center' },
  valeurStat: { fontSize: 16, fontWeight: '700', color: couleurs.vertFonce, textAlign: 'center' },
  libelleStat: { fontSize: 11, color: '#888', textAlign: 'center', marginTop: 4 },
  sousTitreListe: { fontSize: 15, fontWeight: '600', color: couleurs.grisTexte, marginBottom: 8 },
  ligneFinancement: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: couleurs.blanc, borderRadius: 8, padding: 14, marginBottom: 8 },
  codeFinancement: { fontWeight: '600', color: couleurs.grisTexte },
  dateFinancement: { fontSize: 12, color: '#888', marginTop: 2 },
  montantFinancement: { fontWeight: '700', color: couleurs.vertMoyen },
  vide: { textAlign: 'center', color: '#888', marginTop: 20 },
});
