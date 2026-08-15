import { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import appelerApi from '../api/client';
import { couleurs } from '../theme/couleurs';

const INTERVALLE_ACTUALISATION_MS = 30000; // 30s — cohérent avec la cloche Web

/**
 * Bouton cloche — badge du nombre de non-lues, navigue vers l'écran
 * Notifications au tap. Utilisé à la fois dans le bandeau bénéficiaire
 * et le bandeau comité (même composant, chaque écran l'appelle avec sa
 * propre prop navigation).
 */
export default function BoutonCloche({ navigation }) {
  const [nombreNonLues, setNombreNonLues] = useState(0);

  const chargerCompteur = useCallback(async () => {
    try {
      const donnees = await appelerApi('/notifications/non-lues/nombre');
      setNombreNonLues(donnees.total);
    } catch {
      // silencieux : un échec de sondage du compteur ne doit pas gêner l'écran
    }
  }, []);

  useFocusEffect(useCallback(() => {
    chargerCompteur();
    const intervalle = setInterval(chargerCompteur, INTERVALLE_ACTUALISATION_MS);
    return () => clearInterval(intervalle);
  }, [chargerCompteur]));

  return (
    <TouchableOpacity
      style={styles.bouton}
      onPress={() => navigation.navigate('Notifications')}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={styles.icone}>🔔</Text>
      {nombreNonLues > 0 && (
        <View style={styles.badge}>
          <Text style={styles.texteBadge}>{nombreNonLues > 9 ? '9+' : nombreNonLues}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bouton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8,
  },
  icone: { color: couleurs.blanc, fontSize: 17 },
  badge: {
    position: 'absolute', top: -3, right: -3,
    backgroundColor: couleurs.brique, borderRadius: 999,
    minWidth: 16, height: 16, paddingHorizontal: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  texteBadge: { color: couleurs.blanc, fontSize: 9, fontWeight: '700' },
});
