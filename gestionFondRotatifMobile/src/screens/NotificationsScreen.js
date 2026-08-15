import { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import appelerApi from '../api/client';
import { couleurs } from '../theme/couleurs';

/**
 * Notifications — écran partagé par tous les rôles (bénéficiaire,
 * comité...). GET /notifications est automatiquement filtré côté
 * backend sur l'utilisateur connecté, aucune distinction de rôle
 * nécessaire ici.
 */
export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  const charger = useCallback(async () => {
    try {
      const donnees = await appelerApi('/notifications');
      setNotifications(donnees.notifications);
      setErreur('');
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  async function marquerLue(notif) {
    if (notif.lue) return;
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, lue: true } : n)));
    try {
      await appelerApi(`/notifications/${notif.id}/lue`, { method: 'PUT' });
    } catch {
      // best-effort : l'affichage local est déjà mis à jour
    }
  }

  async function marquerToutesLues() {
    setNotifications((prev) => prev.map((n) => ({ ...n, lue: true })));
    try {
      await appelerApi('/notifications/toutes/lues', { method: 'PUT' });
    } catch {
      // idem
    }
  }

  const yADesNonLues = notifications.some((n) => !n.lue);

  return (
    <FlatList
      style={styles.conteneur}
      contentContainerStyle={styles.contenu}
      data={notifications}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={chargement} onRefresh={charger} tintColor={couleurs.vertFonce} />}
      ListHeaderComponent={
        yADesNonLues ? (
          <TouchableOpacity style={styles.boutonToutLu} onPress={marquerToutesLues}>
            <Text style={styles.texteBoutonToutLu}>Tout marquer comme lu</Text>
          </TouchableOpacity>
        ) : null
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.carte, !item.lue && styles.carteNonLue]}
          onPress={() => marquerLue(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.titre}>{item.titre}</Text>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.date}>{new Date(item.dateCreation).toLocaleString('fr-FR')}</Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        !chargement ? <Text style={styles.vide}>{erreur || "Aucune notification pour l'instant."}</Text> : null
      }
    />
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.creme },
  contenu: { padding: 20, paddingBottom: 30 },

  boutonToutLu: { alignSelf: 'flex-end', marginBottom: 12 },
  texteBoutonToutLu: { color: couleurs.vertMoyen, fontSize: 13, fontWeight: '600' },

  carte: {
    backgroundColor: couleurs.blanc, borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  carteNonLue: { backgroundColor: '#f3f8f5', borderLeftWidth: 3, borderLeftColor: couleurs.vertMoyen },
  titre: { fontWeight: '700', color: couleurs.grisTexte, fontSize: 14 },
  message: { fontSize: 13, color: '#555', marginTop: 4 },
  date: { fontSize: 11, color: '#999', marginTop: 6 },

  vide: { textAlign: 'center', color: '#888', marginTop: 30, paddingHorizontal: 20 },
});
