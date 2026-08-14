import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import { couleurs } from '../theme/couleurs';

/**
 * Écran de connexion — Mobile est réservé aux Membres du comité et aux
 * Bénéficiaires (Web = Responsable/Administration/Autorités). Si un
 * autre rôle se connecte ici, on l'informe plutôt que d'afficher un
 * écran vide/cassé.
 *
 * CORRECTION (design) : remplace l'ancien titre centré + carte plate par
 * un bandeau coloré en haut (badge + titre) et une carte qui chevauche
 * légèrement ce bandeau — plus proche de ce qu'on voit dans les apps
 * grand public. Champs avec icône, bouton en pilule avec ombre portée.
 */
export default function ConnexionScreen() {
  const [telephone, setTelephone] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreur, setErreur] = useState('');
  const [champActif, setChampActif] = useState(null); // 'telephone' | 'motDePasse' | null
  const { connecter } = useAuth();

  async function gererConnexion() {
    setErreur('');
    setEnvoiEnCours(true);
    try {
      const utilisateur = await connecter(telephone, motDePasse);
      if (!['MEMBRE_COMITE', 'BENEFICIAIRE'].includes(utilisateur.role)) {
        setErreur("Ce compte n'est pas destiné à l'application Mobile. Utilisez la plateforme Web.");
      }
      // Si le rôle est autorisé, RootNavigator redirige automatiquement
      // (il observe `utilisateur` via useAuth).
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.conteneur}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.defilement} keyboardShouldPersistTaps="handled">
        <View style={styles.bandeau}>
          <View style={styles.badge}>
            <Text style={styles.emojiBadge}>🌱</Text>
          </View>
          <Text style={styles.titre}>Fonds Rotatif MMF</Text>
          <Text style={styles.sousTitre}>COMDEKS4--AJEOV Technologies</Text>
        </View>

        <View style={styles.carte}>
          <Text style={styles.libelleCarte}>Connexion</Text>

          <Text style={styles.libelle}>Téléphone</Text>
          <View style={[styles.champConteneur, champActif === 'telephone' && styles.champConteneurActif]}>
            <Text style={styles.iconeChamp}>📱</Text>
            <TextInput
              style={styles.champ}
              value={telephone}
              onChangeText={setTelephone}
              onFocus={() => setChampActif('telephone')}
              onBlur={() => setChampActif(null)}
              keyboardType="phone-pad"
              autoCapitalize="none"
              placeholder="+237 6xx xxx xxx"
              placeholderTextColor="#aaa"
            />
          </View>

          <Text style={styles.libelle}>Mot de passe</Text>
          <View style={[styles.champConteneur, champActif === 'motDePasse' && styles.champConteneurActif]}>
            <Text style={styles.iconeChamp}>🔒</Text>
            <TextInput
              style={styles.champ}
              value={motDePasse}
              onChangeText={setMotDePasse}
              onFocus={() => setChampActif('motDePasse')}
              onBlur={() => setChampActif(null)}
              secureTextEntry={!motDePasseVisible}
              placeholder="••••••••"
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity
              style={styles.boutonOeil}
              onPress={() => setMotDePasseVisible((v) => !v)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.texteOeil}>{motDePasseVisible ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          {erreur ? (
            <View style={styles.banniereErreur}>
              <Text style={styles.texteErreur}>{erreur}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.bouton, envoiEnCours && styles.boutonDesactive]}
            onPress={gererConnexion}
            disabled={envoiEnCours}
            activeOpacity={0.85}
          >
            {envoiEnCours ? (
              <ActivityIndicator color={couleurs.blanc} />
            ) : (
              <Text style={styles.texteBouton}>SE CONNECTER</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.vertFonce },
  defilement: { flexGrow: 1 },

  bandeau: {
    backgroundColor: couleurs.vertFonce,
    alignItems: 'center',
    paddingTop: 70,
    paddingBottom: 56,
    paddingHorizontal: 24,
  },
  badge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: couleurs.blanc,
    borderWidth: 3,
    borderColor: couleurs.orMil,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emojiBadge: { fontSize: 30 },
  titre: { fontSize: 22, fontWeight: '700', color: couleurs.blanc, textAlign: 'center' },
  sousTitre: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 4 },

  carte: {
    flex: 1,
    backgroundColor: couleurs.creme,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    padding: 24,
    paddingTop: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  libelleCarte: { fontSize: 17, fontWeight: '700', color: couleurs.grisTexte, marginBottom: 18 },

  libelle: { fontSize: 12, fontWeight: '600', color: '#888', marginTop: 14, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 },
  champConteneur: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: couleurs.blanc,
    borderWidth: 1.5,
    borderColor: couleurs.grisClair,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  champConteneurActif: { borderColor: couleurs.vertMoyen },
  iconeChamp: { fontSize: 16, marginRight: 10 },
  champ: { flex: 1, paddingVertical: 13, fontSize: 15, color: couleurs.grisTexte },
  boutonOeil: { paddingLeft: 10, paddingVertical: 6 },
  texteOeil: { fontSize: 18 },

  banniereErreur: {
    backgroundColor: couleurs.briqueClair,
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },
  texteErreur: { color: couleurs.brique, fontSize: 13 },

  bouton: {
    backgroundColor: couleurs.vertFonce,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 26,
    shadowColor: couleurs.vertFonce,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  boutonDesactive: { opacity: 0.6, shadowOpacity: 0 },
  texteBouton: { color: couleurs.blanc, fontWeight: '700', fontSize: 15, letterSpacing: 0.6 },
});
