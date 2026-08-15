import { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import appelerApi from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { couleurs } from '../../theme/couleurs';
import BoutonCloche from '../../components/BoutonCloche';

const LIBELLE_STATUT = {
  EnCours: 'En cours (comité)',
  EnAttenteResponsable: 'Chez la Responsable',
  Validee: 'Validée',
  Rejetee: 'Rejetée',
};

const COULEUR_STATUT = {
  EnCours: couleurs.bleuAttente,
  EnAttenteResponsable: couleurs.orMil,
  Validee: couleurs.vertMoyen,
  Rejetee: couleurs.brique,
};

/**
 * Tableau de bord du comité (= liste des demandes de mon canton, avec
 * les raccourcis vers les autres écrans).
 *
 * CORRECTION (design) : même bandeau coloré que ConnexionScreen (au lieu
 * d'un simple fond crème avec un en-tête plat), et le lien "Déconnexion"
 * devient un bouton icône rond avec confirmation avant de se déconnecter
 * (évite un clic accidentel qui coupait la session sans prévenir).
 */
export default function TableauDeBordComiteScreen({ navigation }) {
  const [demandes, setDemandes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const { utilisateur, deconnecter } = useAuth();

  const charger = useCallback(async () => {
    try {
      const donnees = await appelerApi('/demandes-financement');
      setDemandes(donnees.demandes);
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

  return (
    <FlatList
      style={styles.conteneur}
      contentContainerStyle={styles.contenu}
      data={demandes}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={chargement} onRefresh={charger} tintColor={couleurs.vertFonce} />}
      ListHeaderComponent={
        <View>
          <View style={styles.bandeau}>
            <View style={{ flex: 1 }}>
              <Text style={styles.salutation}>Bonjour 👋</Text>
              <Text style={styles.nom} numberOfLines={1} adjustsFontSizeToFit>{utilisateur?.prenom} {utilisateur?.nom}</Text>
            </View>
            <BoutonCloche navigation={navigation} />
            <TouchableOpacity style={styles.boutonDeconnexion} onPress={confirmerDeconnexion} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.iconeDeconnexion}>🚪</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.zoneActions}>
            <Text style={styles.titreSection}>Demandes de mon canton</Text>

            <TouchableOpacity style={styles.boutonPrincipal} onPress={() => navigation.navigate('CreerDemande')} activeOpacity={0.85}>
              <Text style={styles.texteBoutonPrincipal}>+  Nouvelle demande de financement</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.lienCarte} onPress={() => navigation.navigate('ListeFinancements')} activeOpacity={0.7}>
              <Text style={styles.iconeLien}>💰</Text>
              <Text style={styles.texteLienCarte}>Financements : répartition & remboursements</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.lienCarte} onPress={() => navigation.navigate('ListeBeneficiaires')} activeOpacity={0.7}>
              <Text style={styles.iconeLien}>👥</Text>
              <Text style={styles.texteLienCarte}>Bénéficiaires de mon canton</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.lienCarte} onPress={() => navigation.navigate('ListeGroupes')} activeOpacity={0.7}>
              <Text style={styles.iconeLien}>🤝</Text>
              <Text style={styles.texteLienCarte}>Groupes MMF</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>
      }
      ListEmptyComponent={!chargement ? (
        <Text style={styles.vide}>{erreur || "Aucune demande pour l'instant."}</Text>
      ) : null}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.carte}
          onPress={() => navigation.navigate('DetailDemande', { demandeId: item.id })}
          activeOpacity={0.85}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.code}>{item.codeDemande}</Text>
            <Text style={styles.objet} numberOfLines={2}>{item.objetDemande}</Text>
            <Text style={styles.montant}>{Number(item.montantDemande).toLocaleString('fr-FR')} FCFA</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: COULEUR_STATUT[item.statutGlobal] || '#ccc' }]}>
            <Text style={styles.texteBadge}>{LIBELLE_STATUT[item.statutGlobal] || item.statutGlobal}</Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.creme },
  contenu: { paddingBottom: 20 },

  bandeau: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: couleurs.vertFonce,
    paddingTop: 56,
    paddingBottom: 26,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 18,
  },
  salutation: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  nom: { color: couleurs.blanc, fontSize: 19, fontWeight: '700', marginTop: 2 },
  boutonDeconnexion: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },
  iconeDeconnexion: { color: couleurs.blanc, fontSize: 17 },

  zoneActions: { paddingHorizontal: 20 },
  titreSection: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 },

  boutonPrincipal: {
    backgroundColor: couleurs.vertFonce,
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 10,
    shadowColor: couleurs.vertFonce,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  texteBoutonPrincipal: { color: couleurs.blanc, fontWeight: '700', fontSize: 14, textAlign: 'center' },

  lienCarte: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: couleurs.blanc, borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  iconeLien: { fontSize: 18, marginRight: 10 },
  texteLienCarte: { flex: 1, color: couleurs.vertFonce, fontWeight: '600', fontSize: 13 },
  chevron: { color: '#bbb', fontSize: 20, marginLeft: 6 },

  vide: { textAlign: 'center', color: '#888', marginTop: 20, paddingHorizontal: 20 },

  carte: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: couleurs.blanc, borderRadius: 14, padding: 14,
    marginHorizontal: 20, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  code: { fontWeight: '700', color: couleurs.grisTexte },
  objet: { fontSize: 13, color: '#555', marginTop: 2, marginBottom: 4 },
  montant: { fontWeight: '600', color: couleurs.vertMoyen },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8 },
  texteBadge: { color: couleurs.blanc, fontSize: 10, fontWeight: '600', textAlign: 'center' },
});
