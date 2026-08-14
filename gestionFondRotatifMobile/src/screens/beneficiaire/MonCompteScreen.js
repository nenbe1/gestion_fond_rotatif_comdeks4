import { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import appelerApi from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { couleurs } from '../../theme/couleurs';

const LIBELLE_STATUT = {
  Nouveau: 'Nouveau',
  RemboursementEnCours: 'Remboursement en cours',
  Solde: 'Soldé',
};

export default function MonCompteScreen({ navigation }) {
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

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  function confirmerDeconnexion() {
    Alert.alert('Se déconnecter ?', '', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: deconnecter },
    ]);
  }

  const situation = compte?.situation;
  const resteDu = situation?.resteAPayer ?? 0;

  return (
    <View style={{ flex: 1 }}>
    <FlatList
      style={styles.conteneur}
      contentContainerStyle={styles.contenu}
      data={compte?.financements ?? []}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={chargement} onRefresh={charger} tintColor={couleurs.vertFonce} />}
      ListHeaderComponent={
        <View>
          <View style={styles.bandeau}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.salutation}>Bonjour 👋</Text>
              <Text style={styles.nom}>{utilisateur?.prenom} {utilisateur?.nom}</Text>
              {compte?.beneficiaire && (
                <View style={[styles.badge, styleBadge(compte.beneficiaire.statutMMF)]}>
                  <Text style={styles.texteBadge}>{LIBELLE_STATUT[compte.beneficiaire.statutMMF] || compte.beneficiaire.statutMMF}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.boutonDeconnexion} onPress={confirmerDeconnexion} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.iconeDeconnexion}>🚪</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.zoneContenu}>
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

            <TouchableOpacity style={styles.lienCotisations} onPress={() => navigation.navigate('MesCotisations')} activeOpacity={0.85}>
              <Text style={styles.lienCotisationsTexte}>💰 Voir mes cotisations</Text>
              <Text style={styles.lienCotisationsFleche}>›</Text>
            </TouchableOpacity>

            <Text style={styles.sousTitreListe}>Mes financements</Text>
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.ligneFinancement}
          onPress={() => navigation.navigate('DetailFinancement', {
            attributionId: item.id,
            montantAttribue: item.montantAttribue,
            codeFinancement: item.codeFinancement,
          })}
          activeOpacity={0.85}
        >
          <View>
            <Text style={styles.codeFinancement}>{item.codeFinancement}</Text>
            <Text style={styles.dateFinancement}>
              {new Date(item.dateAttribution).toLocaleDateString('fr-FR')}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.montantFinancement}>{item.montantAttribue.toLocaleString('fr-FR')} FCFA</Text>
            <Text style={item.soldee ? styles.etiquetteSoldee : styles.etiquetteEnCours}>
              {item.soldee ? 'Soldé' : `Reste ${item.resteAPayer.toLocaleString('fr-FR')} FCFA`}
            </Text>
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={!chargement ? <Text style={styles.vide}>Aucun financement reçu pour l'instant.</Text> : null}
    />

      <TouchableOpacity
        style={styles.fabConseillerIA}
        onPress={() => navigation.navigate('ConseillerIA')}
        activeOpacity={0.88}
      >
        <Text style={styles.fabIcone}>🤖</Text>
      </TouchableOpacity>
    </View>
  );
}

function styleBadge(statut) {
  if (statut === 'Solde') return { backgroundColor: couleurs.vertMoyenClair };
  if (statut === 'RemboursementEnCours') return { backgroundColor: couleurs.orMilClair };
  return { backgroundColor: couleurs.bleuAttenteClair };
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.creme },
  contenu: { paddingBottom: 20 },

  bandeau: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: couleurs.vertFonce,
    paddingTop: 56,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  salutation: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  nom: { flexShrink: 1, fontSize: 19, fontWeight: '700', color: couleurs.blanc, marginTop: 2 },
  boutonDeconnexion: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },
  iconeDeconnexion: { color: couleurs.blanc, fontSize: 17 },

  badge: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, marginTop: 8 },
  texteBadge: { fontSize: 12, color: couleurs.grisTexte },

  zoneContenu: { paddingHorizontal: 20, marginTop: -22 },
  erreur: { color: couleurs.brique, marginBottom: 12 },

  grilleCartes: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  carteStat: {
    flex: 1, backgroundColor: couleurs.blanc, borderRadius: 14, padding: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  valeurStat: { fontSize: 16, fontWeight: '700', color: couleurs.vertFonce, textAlign: 'center' },
  libelleStat: { fontSize: 11, color: '#888', textAlign: 'center', marginTop: 4 },

  lienCotisations: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: couleurs.blanc, borderRadius: 14, padding: 16, marginBottom: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  lienCotisationsTexte: { fontSize: 14, fontWeight: '600', color: couleurs.grisTexte },
  lienCotisationsFleche: { fontSize: 20, color: '#bbb' },

  sousTitreListe: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 },
  ligneFinancement: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: couleurs.blanc, borderRadius: 14, padding: 14,
    marginHorizontal: 20, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  codeFinancement: { fontWeight: '600', color: couleurs.grisTexte },
  dateFinancement: { fontSize: 12, color: '#888', marginTop: 2 },
  montantFinancement: { fontWeight: '700', color: couleurs.vertMoyen },
  etiquetteSoldee: { fontSize: 10, color: couleurs.vertMoyen, marginTop: 2, fontWeight: '600' },
  etiquetteEnCours: { fontSize: 10, color: couleurs.brique, marginTop: 2, fontWeight: '600' },
  vide: { textAlign: 'center', color: '#888', marginTop: 20, paddingHorizontal: 20 },

  fabConseillerIA: {
    position: 'absolute', right: 20, bottom: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: couleurs.vertFonce,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
  },
  fabIcone: { fontSize: 24 },
});
