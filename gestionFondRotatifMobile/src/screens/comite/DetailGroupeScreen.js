import { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, TextInput, StyleSheet, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import appelerApi from '../../api/client';
import { telechargerRecuCotisation } from '../../utils/telechargerRecuCotisation';
import { couleurs } from '../../theme/couleurs';

/**
 * Détail d'un groupe MMF : ses membres (ajouter/retirer), son
 * responsable (désigné parmi les membres actifs uniquement — imposé par
 * le backend), et la possibilité de désactiver/réactiver le groupe.
 */
export default function DetailGroupeScreen({ route, navigation }) {
  const { groupeId } = route.params;
  const [groupe, setGroupe] = useState(null);
  const [membres, setMembres] = useState([]);
  const [cotisations, setCotisations] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [recuEnCours, setRecuEnCours] = useState(null); // id de la cotisation dont le reçu se télécharge
  const [filtrePeriode, setFiltrePeriode] = useState('tout'); // 'tout' | 'mois' | 'trimestre'

  const [afficherAjout, setAfficherAjout] = useState(false);
  const [beneficiairesDisponibles, setBeneficiairesDisponibles] = useState([]);
  const [envoiEnCours, setEnvoiEnCours] = useState(null); // id en cours d'action, ou 'ajout'/'bascule'/'nom'/'cotisation'

  const [afficherCotisation, setAfficherCotisation] = useState(false);
  const [beneficiairePourCotisation, setBeneficiairePourCotisation] = useState(null);
  const [montantCotisation, setMontantCotisation] = useState('');
  const [observationCotisation, setObservationCotisation] = useState('');

  const charger = useCallback(async () => {
    try {
      const [g, m, c] = await Promise.all([
        appelerApi(`/groupes-mmf/${groupeId}`),
        appelerApi(`/groupes-mmf/${groupeId}/membres`),
        appelerApi(`/cotisations?groupe_id=${groupeId}`),
      ]);
      setGroupe(g.groupe);
      setMembres(m.membres);
      setCotisations(c.cotisations);
      navigation.setOptions({ title: g.groupe.nom });
      setErreur('');
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }, [groupeId]);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  async function ouvrirAjout() {
    setAfficherAjout(true);
    try {
      const donnees = await appelerApi('/beneficiaires');
      const idsDejaMembers = membres.map((m) => m.beneficiaireId);
      setBeneficiairesDisponibles(donnees.beneficiaires.filter((b) => !idsDejaMembers.includes(b.id)));
    } catch (err) {
      Alert.alert('Erreur', err.message);
    }
  }

  async function gererAjout(beneficiaireId) {
    setEnvoiEnCours('ajout');
    try {
      await appelerApi(`/groupes-mmf/${groupeId}/membres`, { method: 'POST', body: { beneficiaire_id: beneficiaireId } });
      setAfficherAjout(false);
      await charger();
    } catch (err) {
      Alert.alert('Erreur', err.message);
    } finally {
      setEnvoiEnCours(null);
    }
  }

  function confirmerRetrait(membre) {
    Alert.alert(
      'Retirer ce membre ?',
      `${membre.beneficiaireNom} ${membre.beneficiairePrenom} quittera le groupe (son historique de cotisations reste conservé).`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Retirer', style: 'destructive', onPress: () => gererRetrait(membre) },
      ]
    );
  }

  async function gererRetrait(membre) {
    setEnvoiEnCours(membre.id);
    try {
      await appelerApi(`/groupes-mmf/${groupeId}/membres/${membre.id}`, { method: 'DELETE' });
      await charger();
    } catch (err) {
      Alert.alert('Erreur', err.message);
    } finally {
      setEnvoiEnCours(null);
    }
  }

  async function gererDesignationResponsable(membre) {
    setEnvoiEnCours(`resp-${membre.beneficiaireId}`);
    try {
      await appelerApi(`/groupes-mmf/${groupeId}/responsable`, { method: 'PUT', body: { beneficiaire_id: membre.beneficiaireId } });
      await charger();
    } catch (err) {
      Alert.alert('Erreur', err.message);
    } finally {
      setEnvoiEnCours(null);
    }
  }

  async function gererBascule() {
    const nouvelEtat = !groupe.actif;
    Alert.alert(
      nouvelEtat ? 'Réactiver ce groupe ?' : 'Désactiver ce groupe ?',
      nouvelEtat ? '' : 'Il restera consultable mais ne pourra plus recevoir de nouvelles cotisations.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: nouvelEtat ? 'Réactiver' : 'Désactiver',
          onPress: async () => {
            setEnvoiEnCours('bascule');
            try {
              await appelerApi(`/groupes-mmf/${groupeId}/${nouvelEtat ? 'activer' : 'desactiver'}`, { method: 'PUT' });
              await charger();
            } catch (err) {
              Alert.alert('Erreur', err.message);
            } finally {
              setEnvoiEnCours(null);
            }
          },
        },
      ]
    );
  }

  function ouvrirCotisation() {
    setBeneficiairePourCotisation(null);
    setMontantCotisation('');
    setObservationCotisation('');
    setAfficherCotisation(true);
  }

  async function gererCotisation() {
    if (!beneficiairePourCotisation) {
      Alert.alert('Erreur', 'Choisissez le bénéficiaire qui cotise.');
      return;
    }
    if (!montantCotisation || Number(montantCotisation) <= 0) {
      Alert.alert('Erreur', 'Le montant doit être un nombre positif.');
      return;
    }
    setEnvoiEnCours('cotisation');
    try {
      const donnees = await appelerApi('/cotisations', {
        method: 'POST',
        body: {
          groupe_mmf_id: groupeId,
          beneficiaire_id: beneficiairePourCotisation,
          montant: Number(montantCotisation),
          observation: observationCotisation.trim() || undefined,
        },
      });
      setAfficherCotisation(false);
      Alert.alert('Cotisation enregistrée', `Reçu : ${donnees.cotisation.codeCotisation}`);
      await charger();
    } catch (err) {
      Alert.alert('Erreur', err.message);
    } finally {
      setEnvoiEnCours(null);
    }
  }

  /**
   * Télécharge le reçu PDF (route protégée par token) puis propose de le
   * partager/ouvrir — le téléchargement doit passer par expo-file-system
   * (avec l'en-tête Authorization) car un simple lien ouvert dans le
   * navigateur n'aurait pas accès au token de connexion.
   */
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

  function dateLimitePourFiltre(filtre) {
    if (filtre === 'tout') return null;
    const limite = new Date();
    limite.setMonth(limite.getMonth() - (filtre === 'mois' ? 1 : 3));
    return limite.toISOString().slice(0, 10); // format YYYY-MM-DD, comparable directement à date_versement
  }
  const dateLimiteFiltre = dateLimitePourFiltre(filtrePeriode);
  const cotisationsFiltrees = dateLimiteFiltre
    ? cotisations.filter((c) => c.dateVersement >= dateLimiteFiltre)
    : cotisations;

  if (chargement && !groupe) {
    return <View style={styles.centre}><ActivityIndicator size="large" color={couleurs.vertFonce} /></View>;
  }
  if (!groupe) return <View style={styles.centre}><Text>{erreur || 'Groupe introuvable.'}</Text></View>;

  return (
    <FlatList
      style={styles.conteneur}
      contentContainerStyle={styles.contenu}
      data={membres}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={chargement} onRefresh={charger} />}
      ListHeaderComponent={
        <View>
          <View style={styles.carteInfo}>
            <View style={styles.ligneInfo}>
              <Text style={styles.libelleInfo}>Responsable</Text>
              <Text style={styles.valeurInfo}>
                {groupe.responsableNom ? `${groupe.responsableNom} ${groupe.responsablePrenom}` : 'Aucun — désignez-en un ci-dessous'}
              </Text>
            </View>
            <View style={styles.ligneInfo}>
              <Text style={styles.libelleInfo}>Statut</Text>
              <Text style={[styles.valeurInfo, { color: groupe.actif ? couleurs.vertMoyen : couleurs.brique }]}>
                {groupe.actif ? 'Actif' : 'Désactivé'}
              </Text>
            </View>
            <TouchableOpacity style={styles.boutonBascule} onPress={gererBascule} disabled={envoiEnCours === 'bascule'}>
              {envoiEnCours === 'bascule'
                ? <ActivityIndicator size="small" color={couleurs.grisTexte} />
                : <Text style={styles.texteBoutonBascule}>{groupe.actif ? 'Désactiver le groupe' : 'Réactiver le groupe'}</Text>}
            </TouchableOpacity>
          </View>

          {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

          {groupe.actif && (
            afficherCotisation ? (
              <View style={styles.blocAjout}>
                <Text style={styles.titreBloc}>Enregistrer une cotisation</Text>
                <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
                  {membres.map((m) => (
                    <TouchableOpacity
                      key={m.beneficiaireId}
                      style={[
                        styles.optionBeneficiaire,
                        beneficiairePourCotisation === m.beneficiaireId && styles.optionBeneficiaireSelectionnee,
                      ]}
                      onPress={() => setBeneficiairePourCotisation(m.beneficiaireId)}
                    >
                      <Text style={styles.texteOption}>{m.beneficiaireNom} {m.beneficiairePrenom}</Text>
                    </TouchableOpacity>
                  ))}
                  {membres.length === 0 && <Text style={styles.vide}>Ajoutez d'abord un membre au groupe.</Text>}
                </ScrollView>
                <TextInput
                  style={styles.champMontant}
                  value={montantCotisation}
                  onChangeText={setMontantCotisation}
                  placeholder="Montant (FCFA)"
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.champMontant}
                  value={observationCotisation}
                  onChangeText={setObservationCotisation}
                  placeholder="Observation (optionnel)"
                />
                <View style={styles.actionsFormulaire}>
                  <TouchableOpacity style={styles.boutonAnnuler} onPress={() => setAfficherCotisation(false)}>
                    <Text style={styles.texteBoutonAnnuler}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.boutonValider} onPress={gererCotisation} disabled={envoiEnCours === 'cotisation'}>
                    {envoiEnCours === 'cotisation'
                      ? <ActivityIndicator color={couleurs.blanc} />
                      : <Text style={styles.texteBoutonValider}>Enregistrer</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.boutonCotisation} onPress={ouvrirCotisation}>
                <Text style={styles.texteBoutonAjouter}>💰 Enregistrer une cotisation</Text>
              </TouchableOpacity>
            )
          )}

          {afficherAjout ? (
            <View style={styles.blocAjout}>
              <Text style={styles.titreBloc}>Choisir un bénéficiaire</Text>
              <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
                {beneficiairesDisponibles.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={styles.optionBeneficiaire}
                    onPress={() => gererAjout(b.id)}
                    disabled={envoiEnCours === 'ajout'}
                  >
                    <Text style={styles.texteOption}>{b.nom} {b.prenom}</Text>
                  </TouchableOpacity>
                ))}
                {beneficiairesDisponibles.length === 0 && (
                  <Text style={styles.vide}>Tous les bénéficiaires de mon canton sont déjà dans ce groupe.</Text>
                )}
              </ScrollView>
              <TouchableOpacity style={styles.boutonAnnulerBloc} onPress={() => setAfficherAjout(false)}>
                <Text style={styles.texteBoutonAnnuler}>Annuler</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.boutonAjouter} onPress={ouvrirAjout}>
              <Text style={styles.texteBoutonAjouter}>+ Ajouter un membre</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.titreSection}>Membres ({membres.length})</Text>
        </View>
      }
      renderItem={({ item }) => {
        const estResponsable = groupe.responsableBeneficiaireId === item.beneficiaireId;
        return (
          <View style={styles.carteMembre}>
            <View style={{ flex: 1 }}>
              <Text style={styles.nomMembre}>{item.beneficiaireNom} {item.beneficiairePrenom}</Text>
              {estResponsable && <Text style={styles.etiquetteResponsable}>★ Responsable du groupe</Text>}
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {!estResponsable && (
                <TouchableOpacity
                  style={styles.boutonPetit}
                  onPress={() => gererDesignationResponsable(item)}
                  disabled={envoiEnCours === `resp-${item.beneficiaireId}`}
                >
                  <Text style={styles.texteBoutonPetit}>Nommer resp.</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.boutonPetitDanger}
                onPress={() => confirmerRetrait(item)}
                disabled={envoiEnCours === item.id}
              >
                <Text style={styles.texteBoutonPetitDanger}>Retirer</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }}
      ListEmptyComponent={<Text style={styles.vide}>Aucun membre pour l'instant.</Text>}
      ListFooterComponent={
        <View style={{ marginTop: 24 }}>
          <View style={styles.enTeteCotisations}>
            <Text style={styles.titreSection}>Cotisations ({cotisationsFiltrees.length})</Text>
            {cotisationsFiltrees.length > 0 && (
              <Text style={styles.totalGroupe}>
                {cotisationsFiltrees.reduce((somme, c) => somme + Number(c.montant), 0).toLocaleString('fr-FR')} FCFA
              </Text>
            )}
          </View>
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
          {cotisationsFiltrees.length === 0 ? (
            <Text style={styles.vide}>
              {filtrePeriode === 'tout' ? "Aucune cotisation enregistrée pour l'instant." : 'Aucune cotisation sur cette période.'}
            </Text>
          ) : (
            cotisationsFiltrees.map((c) => (
              <View key={c.id} style={styles.carteCotisation}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nomMembre}>{c.beneficiaireNom} {c.beneficiairePrenom}</Text>
                  <Text style={styles.infoCotisation}>{c.codeCotisation} · {c.dateVersement}</Text>
                  <Text style={styles.montantCotisation}>{Number(c.montant).toLocaleString('fr-FR')} FCFA</Text>
                </View>
                <TouchableOpacity
                  style={styles.boutonPetit}
                  onPress={() => telechargerRecu(c)}
                  disabled={recuEnCours === c.id}
                >
                  {recuEnCours === c.id
                    ? <ActivityIndicator size="small" color={couleurs.vertMoyen} />
                    : <Text style={styles.texteBoutonPetit}>📄 Reçu</Text>}
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.creme },
  contenu: { padding: 20 },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: couleurs.creme },
  erreur: { color: couleurs.brique, marginBottom: 12 },

  carteInfo: { backgroundColor: couleurs.blanc, borderRadius: 12, padding: 16, marginBottom: 16 },
  ligneInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  libelleInfo: { color: '#888', fontSize: 13 },
  valeurInfo: { color: couleurs.grisTexte, fontWeight: '600', fontSize: 13, flexShrink: 1, textAlign: 'right' },
  boutonBascule: { marginTop: 6, alignItems: 'center', paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: couleurs.grisClair },
  texteBoutonBascule: { color: couleurs.grisTexte, fontSize: 12, fontWeight: '600' },

  boutonAjouter: { backgroundColor: couleurs.vertFonce, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 16 },
  texteBoutonAjouter: { color: couleurs.blanc, fontWeight: '700' },
  boutonCotisation: { backgroundColor: couleurs.orMil, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 16 },
  blocAjout: { backgroundColor: couleurs.blanc, borderRadius: 12, padding: 14, marginBottom: 16 },
  titreBloc: { fontSize: 13, fontWeight: '700', color: couleurs.grisTexte, marginBottom: 8 },
  optionBeneficiaire: { padding: 10, borderRadius: 6, marginBottom: 4, backgroundColor: couleurs.creme },
  optionBeneficiaireSelectionnee: { backgroundColor: couleurs.vertFonce },
  texteOption: { color: couleurs.grisTexte },
  champMontant: {
    borderWidth: 1, borderColor: couleurs.grisClair, borderRadius: 8,
    padding: 10, fontSize: 14, color: couleurs.grisTexte, marginTop: 10,
  },
  boutonAnnulerBloc: { marginTop: 10, alignItems: 'center', paddingVertical: 8 },
  texteBoutonAnnuler: { color: '#888', fontSize: 13 },
  actionsFormulaire: { flexDirection: 'row', gap: 10, marginTop: 12 },
  boutonAnnuler: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: couleurs.grisClair },
  boutonValider: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8, backgroundColor: couleurs.vertMoyen },
  texteBoutonValider: { color: couleurs.blanc, fontWeight: '600' },

  titreSection: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 },
  enTeteCotisations: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  totalGroupe: { fontSize: 13, fontWeight: '700', color: couleurs.vertFonce },
  rangeeFiltres: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  pastilleFiltre: {
    borderWidth: 1, borderColor: couleurs.grisClair, borderRadius: 18,
    paddingHorizontal: 12, paddingVertical: 6, backgroundColor: couleurs.blanc,
  },
  pastilleFiltreActive: { backgroundColor: couleurs.vertFonce, borderColor: couleurs.vertFonce },
  textePastilleFiltre: { fontSize: 12, color: couleurs.grisTexte, fontWeight: '600' },
  textePastilleFiltreActive: { color: couleurs.blanc },
  carteMembre: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: couleurs.blanc, borderRadius: 10, padding: 14, marginBottom: 8,
  },
  nomMembre: { fontWeight: '600', color: couleurs.grisTexte },
  etiquetteResponsable: { fontSize: 11, color: couleurs.orMil, fontWeight: '600', marginTop: 2 },
  carteCotisation: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: couleurs.blanc, borderRadius: 10, padding: 14, marginBottom: 8,
  },
  infoCotisation: { fontSize: 11, color: '#888', marginTop: 2 },
  montantCotisation: { fontSize: 13, fontWeight: '700', color: couleurs.vertFonce, marginTop: 3 },
  boutonPetit: { borderRadius: 6, paddingVertical: 6, paddingHorizontal: 8, borderWidth: 1, borderColor: couleurs.vertMoyen },
  texteBoutonPetit: { fontSize: 10, color: couleurs.vertMoyen, fontWeight: '600' },
  boutonPetitDanger: { borderRadius: 6, paddingVertical: 6, paddingHorizontal: 8, borderWidth: 1, borderColor: couleurs.brique },
  texteBoutonPetitDanger: { fontSize: 10, color: couleurs.brique, fontWeight: '600' },
  vide: { textAlign: 'center', color: '#888', marginTop: 10 },
});
