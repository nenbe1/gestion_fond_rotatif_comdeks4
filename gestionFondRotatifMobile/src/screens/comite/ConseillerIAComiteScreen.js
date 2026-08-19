import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import appelerApi from '../../api/client';
import { couleurs } from '../../theme/couleurs';

/** Questions proposées au membre du comité tant qu'il n'a encore rien demandé. */
const SUGGESTIONS = [
  'Ce bénéficiaire peut-il emprunter davantage ?',
  'Quel est son reste à payer ?',
  'Comment évaluer son dossier ?',
];

/**
 * Conseiller IA (comité) — même principe que ConseillerIAScreen côté
 * bénéficiaire, mais interrogé ici par un membre du comité au sujet
 * d'un bénéficiaire précis de son canton (choisi depuis
 * ListeBeneficiairesScreen, reçu via route.params.beneficiaireId).
 *
 * Appelle les routes /conseiller-ia/beneficiaires/:id/... (réservées au
 * comité, restreintes à son propre canton côté backend) plutôt que les
 * routes /conseiller-ia/... sans id utilisées par le bénéficiaire
 * lui-même.
 */
export default function ConseillerIAComiteScreen() {
  const route = useRoute();
  const { beneficiaireId, nomBeneficiaire } = route.params || {};

  const [messages, setMessages] = useState([]); // { id, role: 'utilisateur' | 'assistant', texte }
  const [question, setQuestion] = useState('');
  const [chargementHistorique, setChargementHistorique] = useState(true);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [analyseEnCours, setAnalyseEnCours] = useState(false);
  const [erreur, setErreur] = useState('');
  const listeRef = useRef(null);
  const insets = useSafeAreaInsets();

  const chargerHistorique = useCallback(async () => {
    try {
      const donnees = await appelerApi(`/conseiller-ia/beneficiaires/${beneficiaireId}/historique`);
      const historique = [...donnees.historique].reverse(); // du plus ancien au plus récent
      const msgs = [];
      historique.forEach((echange) => {
        msgs.push({ id: `q-${echange.id}`, role: 'utilisateur', texte: echange.question });
        msgs.push({ id: `r-${echange.id}`, role: 'assistant', texte: echange.reponse });
      });
      setMessages(msgs);
      setErreur('');
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargementHistorique(false);
    }
  }, [beneficiaireId]);

  // On ne recharge qu'une fois par arrivée sur l'écran (pas à chaque
  // frappe), pour ne pas écraser une conversation en cours de saisie.
  useFocusEffect(useCallback(() => { chargerHistorique(); }, [chargerHistorique]));

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listeRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, envoiEnCours]);

  async function envoyer(texteQuestion) {
    const texte = texteQuestion.trim();
    if (!texte || envoiEnCours || analyseEnCours) return;

    setErreur('');
    setQuestion('');
    setMessages((prev) => [...prev, { id: `q-temp-${Date.now()}`, role: 'utilisateur', texte }]);
    setEnvoiEnCours(true);

    try {
      const donnees = await appelerApi(`/conseiller-ia/beneficiaires/${beneficiaireId}/demander`, {
        method: 'POST',
        body: { question: texte },
      });
      setMessages((prev) => [
        ...prev,
        { id: `r-${donnees.echange.id}`, role: 'assistant', texte: donnees.echange.reponse },
      ]);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  async function genererAnalyse() {
    if (envoiEnCours || analyseEnCours) return;

    setErreur('');
    setMessages((prev) => [
      ...prev,
      { id: `q-temp-${Date.now()}`, role: 'utilisateur', texte: 'Analyse financière complète' },
    ]);
    setAnalyseEnCours(true);

    try {
      const donnees = await appelerApi(`/conseiller-ia/beneficiaires/${beneficiaireId}/analyse`, { method: 'POST' });
      setMessages((prev) => [
        ...prev,
        { id: `r-${donnees.echange.id}`, role: 'assistant', texte: donnees.echange.reponse },
      ]);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setAnalyseEnCours(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.conteneur}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <View style={[styles.bandeau, { paddingTop: insets.top + 12 }]}>
        <View style={styles.blocTitreBandeau}>
          <Text style={styles.titreBandeau} numberOfLines={1} ellipsizeMode="tail">
            {nomBeneficiaire || 'Bénéficiaire'}
          </Text>
          <Text style={styles.sousTitreBandeau} numberOfLines={1}>Basé sur sa situation réelle</Text>
        </View>
        <TouchableOpacity
          style={styles.boutonAnalyse}
          onPress={genererAnalyse}
          disabled={analyseEnCours || envoiEnCours}
          activeOpacity={0.85}
        >
          {analyseEnCours
            ? <ActivityIndicator size="small" color={couleurs.blanc} />
            : <Text style={styles.texteBoutonAnalyse} numberOfLines={1}>📊 Analyse</Text>}
        </TouchableOpacity>
      </View>

      {chargementHistorique ? (
        <View style={styles.centre}>
          <ActivityIndicator size="large" color={couleurs.vertFonce} />
        </View>
      ) : (
        <FlatList
          ref={listeRef}
          style={styles.liste}
          contentContainerStyle={styles.contenuListe}
          data={messages}
          keyExtractor={(item) => item.id}
          onContentSizeChange={() => listeRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.accueil}>
              <Text style={styles.accueilTexte}>
                Posez une question sur le financement, les remboursements ou le dossier de ce bénéficiaire.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.bulle,
                item.role === 'utilisateur' ? styles.bulleUtilisateur : styles.bulleAssistant,
              ]}
            >
              {item.role === 'utilisateur' ? (
                <Text style={styles.texteUtilisateur}>{item.texte}</Text>
              ) : (
                item.texte.split('\n').map((ligne, i) => {
                  const estTitre = ligne.trim().startsWith('## ');
                  return (
                    <Text
                      key={i}
                      style={estTitre ? styles.titreSectionReponse : styles.texteAssistant}
                    >
                      {estTitre ? ligne.trim().slice(3) : ligne}
                    </Text>
                  );
                })
              )}
            </View>
          )}
          ListFooterComponent={
            (envoiEnCours || analyseEnCours) ? (
              <View style={[styles.bulle, styles.bulleAssistant, styles.bulleChargement]}>
                <ActivityIndicator size="small" color={couleurs.vertMoyen} />
              </View>
            ) : null
          }
        />
      )}

      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

      {!chargementHistorique && messages.length === 0 && (
        <View style={styles.suggestions}>
          {SUGGESTIONS.map((s) => (
            <TouchableOpacity key={s} style={styles.pastilleSuggestion} onPress={() => envoyer(s)} activeOpacity={0.8}>
              <Text style={styles.texteSuggestion}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={[styles.zoneSaisie, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TextInput
          style={styles.champTexte}
          value={question}
          onChangeText={setQuestion}
          placeholder="Écrivez votre question..."
          placeholderTextColor="#999"
          multiline
          maxLength={1000}
          editable={!envoiEnCours && !analyseEnCours}
        />
        <TouchableOpacity
          style={[styles.boutonEnvoyer, (!question.trim() || envoiEnCours || analyseEnCours) && styles.boutonEnvoyerDesactive]}
          onPress={() => envoyer(question)}
          disabled={!question.trim() || envoiEnCours || analyseEnCours}
          activeOpacity={0.85}
        >
          <Text style={styles.iconeEnvoyer}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.creme },

  bandeau: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: couleurs.vertFonce,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  blocTitreBandeau: { flex: 1, flexShrink: 1, minWidth: 0, marginRight: 10 },
  titreBandeau: { fontSize: 15, fontWeight: '700', color: couleurs.blanc },
  sousTitreBandeau: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 1 },

  boutonAnalyse: {
    flexShrink: 0,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  texteBoutonAnalyse: { color: couleurs.blanc, fontSize: 12, fontWeight: '700' },

  centre: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  liste: { flex: 1 },
  contenuListe: { padding: 16, paddingBottom: 8, flexGrow: 1 },

  accueil: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingTop: 40 },
  accueilTexte: { textAlign: 'center', color: '#888', fontSize: 14, lineHeight: 20 },

  bulle: {
    maxWidth: '82%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  bulleUtilisateur: {
    alignSelf: 'flex-end',
    backgroundColor: couleurs.vertFonce,
    borderBottomRightRadius: 4,
  },
  bulleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: couleurs.blanc,
    borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
  },
  bulleChargement: { paddingVertical: 12, paddingHorizontal: 16 },
  texteUtilisateur: { color: couleurs.blanc, fontSize: 14, lineHeight: 20 },
  texteAssistant: { color: couleurs.grisTexte, fontSize: 14, lineHeight: 20 },

  titreSectionReponse: {
    color: couleurs.vertFonce,
    fontWeight: '700',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 2,
  },

  erreur: { color: couleurs.brique, fontSize: 12, textAlign: 'center', marginBottom: 6, paddingHorizontal: 20 },

  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 10 },
  pastilleSuggestion: {
    borderWidth: 1, borderColor: couleurs.grisClair, borderRadius: 18,
    paddingHorizontal: 12, paddingVertical: 7, backgroundColor: couleurs.blanc,
  },
  texteSuggestion: { fontSize: 12.5, color: couleurs.vertFonce, fontWeight: '600' },

  zoneSaisie: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: couleurs.grisClair,
    backgroundColor: couleurs.blanc,
  },
  champTexte: {
    flex: 1,
    backgroundColor: couleurs.creme,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: couleurs.grisTexte,
    maxHeight: 100,
    marginRight: 10,
  },
  boutonEnvoyer: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: couleurs.vertFonce,
    alignItems: 'center', justifyContent: 'center',
  },
  boutonEnvoyerDesactive: { backgroundColor: couleurs.grisClair },
  iconeEnvoyer: { color: couleurs.blanc, fontSize: 16 },
});
