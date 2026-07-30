import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { couleurs } from '../theme/couleurs';

/**
 * Écran de connexion — Mobile est réservé aux Membres du comité et aux
 * Bénéficiaires (Web = Responsable/Administration/Autorités). Si un
 * autre rôle se connecte ici, on l'informe plutôt que d'afficher un
 * écran vide/cassé.
 */
export default function ConnexionScreen() {
  const [telephone, setTelephone] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreur, setErreur] = useState('');
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
      <Text style={styles.titre}>Fonds Rotatif MMF</Text>
      <Text style={styles.sousTitre}>AJEOV Technologies</Text>

      <View style={styles.carte}>
        <Text style={styles.libelle}>Téléphone</Text>
        <TextInput
          style={styles.champ}
          value={telephone}
          onChangeText={setTelephone}
          keyboardType="phone-pad"
          autoCapitalize="none"
          placeholder="+237 6xx xxx xxx"
        />

        <Text style={styles.libelle}>Mot de passe</Text>
        <View style={styles.champAvecBouton}>
          <TextInput
            style={styles.champMotDePasse}
            value={motDePasse}
            onChangeText={setMotDePasse}
            secureTextEntry={!motDePasseVisible}
            placeholder="••••••••"
          />
          <TouchableOpacity
            style={styles.boutonOeil}
            onPress={() => setMotDePasseVisible((v) => !v)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.texteOeil}>{motDePasseVisible ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        </View>

        {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

        <TouchableOpacity
          style={[styles.bouton, envoiEnCours && styles.boutonDesactive]}
          onPress={gererConnexion}
          disabled={envoiEnCours}
        >
          {envoiEnCours ? (
            <ActivityIndicator color={couleurs.blanc} />
          ) : (
            <Text style={styles.texteBouton}>Se connecter</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.creme, justifyContent: 'center', padding: 24 },
  titre: { fontSize: 26, fontWeight: '700', color: couleurs.vertFonce, textAlign: 'center' },
  sousTitre: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 32 },
  carte: { backgroundColor: couleurs.blanc, borderRadius: 12, padding: 20, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  libelle: { fontSize: 13, color: couleurs.grisTexte, marginTop: 12, marginBottom: 4 },
  champ: { borderWidth: 1, borderColor: couleurs.grisClair, borderRadius: 8, padding: 12, fontSize: 15 },
  champAvecBouton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: couleurs.grisClair, borderRadius: 8 },
  champMotDePasse: { flex: 1, padding: 12, fontSize: 15 },
  boutonOeil: { paddingHorizontal: 12 },
  texteOeil: { fontSize: 18 },
  erreur: { color: couleurs.brique, marginTop: 12, fontSize: 13 },
  bouton: { backgroundColor: couleurs.vertFonce, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 20 },
  boutonDesactive: { opacity: 0.6 },
  texteBouton: { color: couleurs.blanc, fontWeight: '600', fontSize: 15 },
});
