import { useCallback, useState } from 'react';
import { View, Text, FlatList, ScrollView, TextInput, TouchableOpacity, StyleSheet, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import appelerApi from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { couleurs } from '../../theme/couleurs';

/**
 * Écran central du comité pour un financement : c'est ici qu'il
 * répartit la somme reçue entre les bénéficiaires (chacun n'a jamais
 * qu'une vue individuelle de sa propre part), et que le Trésorier
 * enregistre puis confirme les remboursements qu'il collecte
 * physiquement auprès de chacun d'eux (double validation, décidée
 * ensemble : n'importe quel membre du comité peut enregistrer ce qu'il
 * a vu remettre, mais seul le Trésorier confirme après vérification —
 * c'est seulement à la confirmation que ça compte pour le bénéficiaire).
 * Le remboursement collectif au fonds (circuit de validation à part)
 * est accessible depuis ici via un lien dédié.
 */
export default function DetailFinancementComiteScreen({ route, navigation }) {
  const { financementId, codeFinancement, montantFinancement } = route.params;
  const { utilisateur } = useAuth();
  // CORRECTION : n'est plus figé sur "fonction_code === 'TRESORIER'" —
  // suit maintenant l'habilitation CONFIRMER_REMBOURSEMENT assignée à la
  // fonction (configurable dans Paramétrage > Fonctions côté Web).
  const peutConfirmer = utilisateur?.habilitations?.includes('CONFIRMER_REMBOURSEMENT') ?? false;

  const [attributions, setAttributions] = useState([]);
  const [restants, setRestants] = useState({}); // { [attributionId]: resteAPayer }
  const [enAttenteParAttribution, setEnAttenteParAttribution] = useState({}); // { [attributionId]: [remboursements EnAttente] }
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  const [afficherFormulaireAttribution, setAfficherFormulaireAttribution] = useState(false);
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [beneficiaireChoisiId, setBeneficiaireChoisiId] = useState('');
  const [montantPart, setMontantPart] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const [attributionEnRemboursement, setAttributionEnRemboursement] = useState(null); // id ou null
  const [montantRembourse, setMontantRembourse] = useState('');
  const [confirmationEnCoursId, setConfirmationEnCoursId] = useState(null);

  const charger = useCallback(async () => {
    try {
      const donnees = await appelerApi(`/attributions/financement/${financementId}`);
      setAttributions(donnees.attributions);

      const entries = await Promise.all(
        donnees.attributions.map((a) => appelerApi(`/attributions/${a.id}/reste-a-payer`).then((r) => [a.id, r.resteAPayer]))
      );
      setRestants(Object.fromEntries(entries));

      const entreesEnAttente = await Promise.all(
        donnees.attributions.map((a) =>
          appelerApi(`/remboursements/individuel/attribution/${a.id}`)
            .then((r) => [a.id, r.remboursements.filter((x) => x.statut === 'EnAttente')])
        )
      );
      setEnAttenteParAttribution(Object.fromEntries(entreesEnAttente));

      setErreur('');
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }, [financementId]);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  const montantDejaReparti = attributions.reduce((s, a) => s + Number(a.montantAttribue), 0);
  const montantRestantARepartir = Number(montantFinancement) - montantDejaReparti;

  async function ouvrirFormulaireAttribution() {
    setAfficherFormulaireAttribution(true);
    try {
      const donnees = await appelerApi('/beneficiaires');
      setBeneficiaires(donnees.beneficiaires);
    } catch (err) {
      Alert.alert('Erreur', err.message);
    }
  }

  async function gererCreationAttribution() {
    if (!beneficiaireChoisiId) {
      Alert.alert('Erreur', 'Choisissez un bénéficiaire.');
      return;
    }
    if (!montantPart || Number(montantPart) <= 0) {
      Alert.alert('Erreur', 'Entrez un montant valide.');
      return;
    }
    setEnvoiEnCours(true);
    try {
      await appelerApi('/attributions', {
        method: 'POST',
        body: {
          financement_id: financementId,
          beneficiaire_id: beneficiaireChoisiId,
          montant_attribue: Number(montantPart),
        },
      });
      setBeneficiaireChoisiId('');
      setMontantPart('');
      setAfficherFormulaireAttribution(false);
      await charger();
    } catch (err) {
      Alert.alert('Erreur', err.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  async function gererEnregistrementRemboursement(attributionId) {
    if (!montantRembourse || Number(montantRembourse) <= 0) {
      Alert.alert('Erreur', 'Entrez un montant valide.');
      return;
    }
    setEnvoiEnCours(true);
    try {
      await appelerApi('/remboursements/individuel', {
        method: 'POST',
        body: {
          attribution_financement_id: attributionId,
          montant: Number(montantRembourse),
          date_versement: new Date().toISOString().slice(0, 10),
        },
      });
      setMontantRembourse('');
      setAttributionEnRemboursement(null);
      await charger();
    } catch (err) {
      Alert.alert('Erreur', err.message);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  // AJOUT : confirmation par le Trésorier — c'est cette étape qui fait
  // réellement compter le remboursement pour le bénéficiaire.
  async function gererConfirmation(remboursementId) {
    setConfirmationEnCoursId(remboursementId);
    try {
      await appelerApi(`/remboursements/individuel/${remboursementId}/confirmer`, { method: 'PUT' });
      await charger();
    } catch (err) {
      Alert.alert('Erreur', err.message);
    } finally {
      setConfirmationEnCoursId(null);
    }
  }

  function confirmerRejet(remboursementId) {
    Alert.alert(
      'Annuler cet enregistrement ?',
      "Le montant n'a jamais compté pour le bénéficiaire (il fallait ta confirmation) — cette action l'annule simplement.",
      [
        { text: 'Retour', style: 'cancel' },
        { text: 'Annuler l\'enregistrement', style: 'destructive', onPress: () => gererRejet(remboursementId) },
      ]
    );
  }

  async function gererRejet(remboursementId) {
    setConfirmationEnCoursId(remboursementId);
    try {
      await appelerApi(`/remboursements/individuel/${remboursementId}/rejeter`, { method: 'PUT' });
      await charger();
    } catch (err) {
      Alert.alert('Erreur', err.message);
    } finally {
      setConfirmationEnCoursId(null);
    }
  }

  return (
    <FlatList
      style={styles.conteneur}
      contentContainerStyle={styles.contenu}
      data={attributions}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={chargement} onRefresh={charger} />}
      ListHeaderComponent={
        <View>
          <Text style={styles.code}>{codeFinancement}</Text>
          <Text style={styles.montant}>{Number(montantFinancement).toLocaleString('fr-FR')} FCFA au total</Text>
          <Text style={styles.montantRestant}>
            {montantRestantARepartir > 0
              ? `${montantRestantARepartir.toLocaleString('fr-FR')} FCFA encore à répartir`
              : 'Entièrement réparti'}
          </Text>

          {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

          {montantRestantARepartir > 0 && !afficherFormulaireAttribution && (
            <TouchableOpacity style={styles.boutonAjouter} onPress={ouvrirFormulaireAttribution}>
              <Text style={styles.texteBoutonAjouter}>+ Répartir à un bénéficiaire</Text>
            </TouchableOpacity>
          )}

          {afficherFormulaireAttribution && (
            <View style={styles.formulaire}>
              <Text style={styles.libelleChamp}>Bénéficiaire</Text>
              <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
                {beneficiaires.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={[styles.optionBeneficiaire, beneficiaireChoisiId === b.id && styles.optionBeneficiaireChoisie]}
                    onPress={() => setBeneficiaireChoisiId(b.id)}
                  >
                    <Text style={beneficiaireChoisiId === b.id ? styles.texteOptionChoisie : styles.texteOption}>
                      {b.nom} {b.prenom}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.libelleChamp}>Montant de sa part (FCFA)</Text>
              <TextInput style={styles.champ} keyboardType="numeric" value={montantPart} onChangeText={setMontantPart} placeholder={`Max ${montantRestantARepartir.toLocaleString('fr-FR')}`} />
              <View style={styles.actionsFormulaire}>
                <TouchableOpacity style={styles.boutonAnnuler} onPress={() => setAfficherFormulaireAttribution(false)}>
                  <Text style={styles.texteBoutonAnnuler}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.boutonValider} onPress={gererCreationAttribution} disabled={envoiEnCours}>
                  {envoiEnCours ? <ActivityIndicator color={couleurs.blanc} /> : <Text style={styles.texteBoutonValider}>Valider</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.lienCollectif}
            onPress={() => navigation.navigate('DetailFinancementRemboursements', { financementId, codeFinancement, montantFinancement })}
          >
            <Text style={styles.texteLienCollectif}>Remboursement collectif au fonds →</Text>
          </TouchableOpacity>

          <Text style={styles.sousTitreListe}>Parts attribuées</Text>
        </View>
      }
      renderItem={({ item }) => {
        const enAttente = enAttenteParAttribution[item.id] || [];
        return (
          <View style={styles.carteBeneficiaire}>
            <View style={styles.enteteCarteBeneficiaire}>
              <Text style={styles.nomBeneficiaire}>{item.beneficiaireNom} {item.beneficiairePrenom}</Text>
              <Text style={styles.partBeneficiaire}>{Number(item.montantAttribue).toLocaleString('fr-FR')} FCFA</Text>
            </View>
            <Text style={styles.resteBeneficiaire}>
              Reste à percevoir de sa part : {(restants[item.id] ?? 0).toLocaleString('fr-FR')} FCFA
            </Text>

            {enAttente.length > 0 && (
              <View style={styles.blocEnAttente}>
                <Text style={styles.titreEnAttente}>En attente de confirmation</Text>
                {enAttente.map((r) => (
                  <View key={r.id} style={styles.ligneEnAttente}>
                    <Text style={styles.montantEnAttente}>{Number(r.montant).toLocaleString('fr-FR')} FCFA</Text>
                    {peutConfirmer ? (
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <TouchableOpacity
                          style={styles.boutonConfirmer}
                          disabled={confirmationEnCoursId === r.id}
                          onPress={() => gererConfirmation(r.id)}
                        >
                          {confirmationEnCoursId === r.id
                            ? <ActivityIndicator color={couleurs.blanc} size="small" />
                            : <Text style={styles.texteBoutonConfirmer}>Confirmer</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.boutonAnnulerPetit}
                          disabled={confirmationEnCoursId === r.id}
                          onPress={() => confirmerRejet(r.id)}
                        >
                          <Text style={styles.texteBoutonAnnulerPetit}>Annuler</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={styles.attenteTresorier}>En attente de confirmation</Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {attributionEnRemboursement === item.id ? (
              <View style={styles.formulaireInline}>
                <TextInput
                  style={styles.champ}
                  keyboardType="numeric"
                  value={montantRembourse}
                  onChangeText={setMontantRembourse}
                  placeholder="Montant reçu (FCFA)"
                  autoFocus
                />
                <View style={styles.actionsFormulaire}>
                  <TouchableOpacity style={styles.boutonAnnuler} onPress={() => setAttributionEnRemboursement(null)}>
                    <Text style={styles.texteBoutonAnnuler}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.boutonValider} onPress={() => gererEnregistrementRemboursement(item.id)} disabled={envoiEnCours}>
                    {envoiEnCours ? <ActivityIndicator color={couleurs.blanc} /> : <Text style={styles.texteBoutonValider}>Valider</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.boutonRembourser} onPress={() => setAttributionEnRemboursement(item.id)}>
                <Text style={styles.texteBoutonRembourser}>Enregistrer un remboursement reçu</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      }}
      ListEmptyComponent={!chargement ? <Text style={styles.vide}>Aucune part encore attribuée.</Text> : null}
    />
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.creme },
  contenu: { padding: 20 },
  code: { fontSize: 14, color: '#888' },
  montant: { fontSize: 16, fontWeight: '600', color: couleurs.vertMoyen, marginTop: 4 },
  montantRestant: { fontSize: 13, color: couleurs.orMil, marginTop: 2, marginBottom: 16 },
  erreur: { color: couleurs.brique, marginBottom: 12 },
  boutonAjouter: { backgroundColor: couleurs.vertFonce, borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 16 },
  texteBoutonAjouter: { color: couleurs.blanc, fontWeight: '600' },
  formulaire: { backgroundColor: couleurs.blanc, borderRadius: 10, padding: 14, marginBottom: 16 },
  formulaireInline: { marginTop: 10 },
  libelleChamp: { fontSize: 13, color: couleurs.grisTexte, marginTop: 8, marginBottom: 4 },
  champ: { borderWidth: 1, borderColor: couleurs.grisClair, borderRadius: 8, padding: 10, fontSize: 15 },
  optionBeneficiaire: { padding: 10, borderRadius: 6, marginBottom: 4, backgroundColor: couleurs.creme },
  optionBeneficiaireChoisie: { backgroundColor: couleurs.vertFonce },
  texteOption: { color: couleurs.grisTexte },
  texteOptionChoisie: { color: couleurs.blanc, fontWeight: '600' },
  actionsFormulaire: { flexDirection: 'row', gap: 10, marginTop: 12 },
  boutonAnnuler: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: couleurs.grisClair },
  texteBoutonAnnuler: { color: couleurs.grisTexte },
  boutonValider: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8, backgroundColor: couleurs.vertMoyen },
  texteBoutonValider: { color: couleurs.blanc, fontWeight: '600' },
  lienCollectif: { backgroundColor: couleurs.blanc, borderRadius: 8, padding: 12, marginBottom: 20 },
  texteLienCollectif: { color: couleurs.vertFonce, fontWeight: '600', fontSize: 13 },
  sousTitreListe: { fontSize: 15, fontWeight: '600', color: couleurs.grisTexte, marginBottom: 8 },
  carteBeneficiaire: { backgroundColor: couleurs.blanc, borderRadius: 10, padding: 14, marginBottom: 10 },
  enteteCarteBeneficiaire: { flexDirection: 'row', justifyContent: 'space-between' },
  nomBeneficiaire: { fontWeight: '600', color: couleurs.grisTexte },
  partBeneficiaire: { fontWeight: '700', color: couleurs.vertMoyen },
  resteBeneficiaire: { fontSize: 12, color: '#888', marginTop: 4 },
  boutonRembourser: { marginTop: 10, borderRadius: 6, borderWidth: 1, borderColor: couleurs.vertMoyen, padding: 8, alignItems: 'center' },
  texteBoutonRembourser: { color: couleurs.vertMoyen, fontSize: 12, fontWeight: '600' },
  vide: { textAlign: 'center', color: '#888', marginTop: 10 },

  blocEnAttente: { backgroundColor: couleurs.orMilClair, borderRadius: 8, padding: 10, marginTop: 10 },
  titreEnAttente: { fontSize: 11, fontWeight: '700', color: couleurs.orMil, textTransform: 'uppercase', marginBottom: 6 },
  ligneEnAttente: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  montantEnAttente: { fontWeight: '600', color: couleurs.grisTexte },
  attenteTresorier: { fontSize: 11, color: '#888', fontStyle: 'italic' },
  boutonConfirmer: { backgroundColor: couleurs.vertMoyen, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10 },
  texteBoutonConfirmer: { color: couleurs.blanc, fontSize: 11, fontWeight: '600' },
  boutonAnnulerPetit: { borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: couleurs.brique },
  texteBoutonAnnulerPetit: { color: couleurs.brique, fontSize: 11, fontWeight: '600' },
});
