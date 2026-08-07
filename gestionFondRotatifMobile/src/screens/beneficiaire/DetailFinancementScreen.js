import { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import appelerApi from '../../api/client';
import { couleurs } from '../../theme/couleurs';

const LIBELLE_STATUT = { EnAttente: 'En attente de confirmation', Confirme: 'Confirmé', Rejete: 'Annulé' };

/**
 * Détail des remboursements d'un financement reçu par le bénéficiaire —
 * STRICTEMENT en lecture seule. Le bénéficiaire remet l'argent en main
 * propre au comité (jamais directement dans le système) ; c'est le
 * comité qui enregistre chaque remboursement de son côté. Le bénéficiaire
 * ne fait ici que consulter ce qui a déjà été enregistré pour lui, et son
 * reste à payer individuel (jamais un total global du fonds).
 *
 * CORRECTION (double validation) : un remboursement fraîchement
 * enregistré par le comité est "En attente de confirmation" — il ne
 * compte pas encore dans le reste à payer tant que le Trésorier ne l'a
 * pas confirmé (voir le libellé sur chaque ligne). Le reste à payer
 * vient maintenant directement du backend (/attributions/:id/reste-a-payer),
 * qui applique déjà cette règle, au lieu d'un calcul approximatif fait
 * ici (qui comptait à tort les remboursements pas encore confirmés).
 */
export default function DetailFinancementScreen({ route }) {
  const { attributionId, montantAttribue, codeFinancement } = route.params;
  const [remboursements, setRemboursements] = useState([]);
  const [resteInfo, setResteInfo] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  const charger = useCallback(async () => {
    try {
      const [donnees, reste] = await Promise.all([
        appelerApi(`/remboursements/individuel/attribution/${attributionId}`),
        appelerApi(`/attributions/${attributionId}/reste-a-payer`),
      ]);
      setRemboursements(donnees.remboursements);
      setResteInfo(reste);
      setErreur('');
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }, [attributionId]);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  const resteAPayer = resteInfo?.resteAPayer ?? 0;

  return (
    <FlatList
      style={styles.conteneur}
      contentContainerStyle={styles.contenu}
      data={remboursements}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={chargement} onRefresh={charger} />}
      ListHeaderComponent={
        <View>
          <Text style={styles.code}>{codeFinancement}</Text>

          <View style={styles.grilleCartes}>
            <View style={styles.carteStat}>
              <Text style={styles.valeurStat}>{Number(montantAttribue).toLocaleString('fr-FR')}</Text>
              <Text style={styles.libelleStat}>FCFA reçus (ma part)</Text>
            </View>
            <View style={styles.carteStat}>
              <Text style={[styles.valeurStat, { color: couleurs.brique }]}>{resteAPayer.toLocaleString('fr-FR')}</Text>
              <Text style={styles.libelleStat}>FCFA restant à remettre au comité</Text>
            </View>
          </View>

          {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

          <Text style={styles.note}>
            Remettez votre remboursement en main propre à votre membre du comité — c'est lui qui l'enregistre ici.
            Ça n'est compté ci-dessus qu'une fois confirmé par le Trésorier.
          </Text>

          <Text style={styles.sousTitreListe}>Historique de mes remboursements</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.ligne}>
          <View>
            <Text style={styles.dateLigne}>{new Date(item.dateVersement).toLocaleDateString('fr-FR')}</Text>
            <Text style={styles.statutLigne}>{LIBELLE_STATUT[item.statut] || item.statut}</Text>
          </View>
          <Text style={styles.montantLigne}>{Number(item.montant).toLocaleString('fr-FR')} FCFA</Text>
        </View>
      )}
      ListEmptyComponent={!chargement ? <Text style={styles.vide}>Aucun remboursement enregistré pour l'instant.</Text> : null}
    />
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.creme },
  contenu: { padding: 20 },
  code: { fontSize: 14, color: '#888', marginBottom: 10 },
  grilleCartes: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  carteStat: { flex: 1, backgroundColor: couleurs.blanc, borderRadius: 10, padding: 12, alignItems: 'center' },
  valeurStat: { fontSize: 16, fontWeight: '700', color: couleurs.vertFonce, textAlign: 'center' },
  libelleStat: { fontSize: 11, color: '#888', textAlign: 'center', marginTop: 4 },
  erreur: { color: couleurs.brique, marginBottom: 12 },
  note: { fontSize: 12, color: '#888', fontStyle: 'italic', marginBottom: 20 },
  sousTitreListe: { fontSize: 15, fontWeight: '600', color: couleurs.grisTexte, marginBottom: 8 },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: couleurs.blanc, borderRadius: 8, padding: 14, marginBottom: 8 },
  dateLigne: { color: couleurs.grisTexte },
  statutLigne: { fontSize: 11, color: '#888', marginTop: 2 },
  montantLigne: { fontWeight: '700', color: couleurs.vertMoyen },
  vide: { textAlign: 'center', color: '#888', marginTop: 10 },
});
