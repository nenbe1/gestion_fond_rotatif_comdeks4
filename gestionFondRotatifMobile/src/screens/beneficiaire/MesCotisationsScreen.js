import { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import appelerApi from '../../api/client';
import { telechargerRecuCotisation } from '../../utils/telechargerRecuCotisation';
import { couleurs } from '../../theme/couleurs';

/**
 * Mes cotisations (bénéficiaire) — historique de ses versements dans
 * ses groupes MMF, avec téléchargement du reçu PDF pour chacun.
 * GET /cotisations est automatiquement filtré côté backend sur le
 * bénéficiaire connecté (voir cotisation.controller.js) — aucun risque
 * de voir les cotisations d'quelqu'un d'autre.
 */
export default function MesCotisationsScreen() {
  const [cotisations, setCotisations] = useState([]);
  const [groupes, setGroupes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [recuEnCours, setRecuEnCours] = useState(null);

  const charger = useCallback(async () => {
    try {
      const [c, g] = await Promise.all([
        appelerApi('/cotisations'),
        appelerApi('/groupes-mmf/mes-groupes'),
      ]);
      setCotisations(c.cotisations);
      setGroupes(g.groupes);
      setErreur('');
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  const [filtrePeriode, setFiltrePeriode] = useState('tout'); // 'tout' | 'mois' | 'trimestre'

  function dateLimitePourFiltre(filtre) {
    if (filtre === 'tout') return null;
    const limite = new Date();
    limite.setMonth(limite.getMonth() - (filtre === 'mois' ? 1 : 3));
    return limite.toISOString().slice(0, 10); // format YYYY-MM-DD, comparable directement à date_versement
  }

  const dateLimite = dateLimitePourFiltre(filtrePeriode);
  const cotisationsFiltrees = dateLimite ? cotisations.filter((c) => c.dateVersement >= dateLimite) : cotisations;
  const total = cotisationsFiltrees.reduce((somme, c) => somme + Number(c.montant), 0);

  async function telechargerRecu(cotisation) {
    setRecuEnCours(cotisation.id);
    try {
      await telechargerRecuCotisation(cotisation.id, cotisation.codeCotisation);
    } catch (err) {
      Alert.alert('Erreur', err.message);
    } finally {
      setRecuEnCours(null);
    }
  }

  return (
    <FlatList
      style={styles.conteneur}
      contentContainerStyle={styles.contenu}
      data={cotisationsFiltrees}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={chargement} onRefresh={charger} tintColor={couleurs.vertFonce} />}
      ListHeaderComponent={
        <View>
          <View style={styles.carteTotal}>
            <Text style={styles.libelleTotal}>Total cotisé</Text>
            <Text style={styles.valeurTotal}>{total.toLocaleString('fr-FR')} FCFA</Text>
            {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}
          </View>

          <Text style={styles.titreSection}>Mes groupes ({groupes.length})</Text>
          {groupes.length === 0 && !chargement ? (
            <Text style={styles.videGroupes}>Vous n'appartenez à aucun groupe MMF pour l'instant.</Text>
          ) : (
            groupes.map((g) => (
              <View key={g.id} style={styles.carteGroupe}>
                <Text style={styles.nomGroupe}>{g.nom}</Text>
                <Text style={styles.infoGroupe}>{g.cantonNom} · {g.nombreMembres} membre{g.nombreMembres > 1 ? 's' : ''}</Text>
                <Text style={styles.infoGroupe}>Membre depuis le {g.dateAdhesion}</Text>
              </View>
            ))
          )}

          <Text style={[styles.titreSection, { marginTop: 18 }]}>Historique des cotisations</Text>
          <View style={styles.rangeeFiltres}>
            {[
              { cle: 'tout', libelle: 'Tout' },
              { cle: 'mois', libelle: 'Ce mois-ci' },
              { cle: 'trimestre', libelle: '3 derniers mois' },
            ].map((f) => (
              <TouchableOpacity
                key={f.cle}
                style={[styles.pastilleFiltre, filtrePeriode === f.cle && styles.pastilleFiltreActive]}
                onPress={() => setFiltrePeriode(f.cle)}
              >
                <Text style={[styles.textePastilleFiltre, filtrePeriode === f.cle && styles.textePastilleFiltreActive]}>
                  {f.libelle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.carteCotisation}>
          <View style={{ flex: 1 }}>
            <Text style={styles.groupeNom}>{item.groupeNom}</Text>
            <Text style={styles.infoCotisation}>{item.codeCotisation} · {item.dateVersement}</Text>
            <Text style={styles.montant}>{Number(item.montant).toLocaleString('fr-FR')} FCFA</Text>
          </View>
          <TouchableOpacity
            style={styles.boutonRecu}
            onPress={() => telechargerRecu(item)}
            disabled={recuEnCours === item.id}
          >
            {recuEnCours === item.id
              ? <ActivityIndicator size="small" color={couleurs.vertMoyen} />
              : <Text style={styles.texteBoutonRecu}>📄 Reçu</Text>}
          </TouchableOpacity>
        </View>
      )}
      ListEmptyComponent={
        !chargement ? (
          <Text style={styles.vide}>
            {dateLimite ? "Aucune cotisation sur cette période." : "Aucune cotisation enregistrée pour l'instant."}
          </Text>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.creme },
  contenu: { padding: 20, paddingBottom: 30 },

  carteTotal: {
    backgroundColor: couleurs.vertFonce, borderRadius: 16, padding: 20, marginBottom: 18, alignItems: 'center',
  },
  libelleTotal: { color: 'rgba(255,255,255,0.75)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4 },
  valeurTotal: { color: couleurs.blanc, fontSize: 24, fontWeight: '700', marginTop: 4 },
  erreur: { color: '#ffd7d0', fontSize: 12, marginTop: 8, textAlign: 'center' },

  titreSection: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 },
  videGroupes: { color: '#888', fontSize: 13, marginBottom: 16 },
  carteGroupe: {
    backgroundColor: couleurs.blanc, borderRadius: 12, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  nomGroupe: { fontWeight: '700', color: couleurs.grisTexte, fontSize: 14 },
  infoGroupe: { fontSize: 11, color: '#888', marginTop: 2 },

  carteCotisation: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: couleurs.blanc, borderRadius: 12, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  groupeNom: { fontWeight: '700', color: couleurs.grisTexte },
  infoCotisation: { fontSize: 11, color: '#888', marginTop: 2 },
  montant: { fontSize: 14, fontWeight: '700', color: couleurs.vertFonce, marginTop: 4 },
  boutonRecu: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: couleurs.creme, borderRadius: 8 },
  texteBoutonRecu: { fontSize: 12, fontWeight: '600', color: couleurs.vertFonce },

  vide: { textAlign: 'center', color: '#888', marginTop: 30, paddingHorizontal: 20 },

  rangeeFiltres: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  pastilleFiltre: {
    borderWidth: 1, borderColor: couleurs.grisClair, borderRadius: 18,
    paddingHorizontal: 12, paddingVertical: 6, backgroundColor: couleurs.blanc,
  },
  pastilleFiltreActive: { backgroundColor: couleurs.vertFonce, borderColor: couleurs.vertFonce },
  textePastilleFiltre: { fontSize: 12, color: couleurs.grisTexte, fontWeight: '600' },
  textePastilleFiltreActive: { color: couleurs.blanc },
});
