import { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import appelerApi from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { couleurs } from '../../theme/couleurs';

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

  return (
    <FlatList
      style={styles.conteneur}
      contentContainerStyle={styles.contenu}
      data={demandes}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={chargement} onRefresh={charger} />}
      ListHeaderComponent={
        <View>
          <View style={styles.entete}>
            <Text style={styles.titre} numberOfLines={1} adjustsFontSizeToFit>Demandes</Text>
            <TouchableOpacity onPress={deconnecter}><Text style={styles.deconnexion}>Déconnexion</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.boutonNouvelleDemande} onPress={() => navigation.navigate('CreerDemande')}>
            <Text style={styles.texteBoutonNouvelleDemande}>+ Nouvelle demande de financement</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.lienRemboursements} onPress={() => navigation.navigate('ListeFinancements')}>
            <Text style={styles.texteLienRemboursements}>Financements : répartition & remboursements →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.lienRemboursements} onPress={() => navigation.navigate('ListeBeneficiaires')}>
            <Text style={styles.texteLienRemboursements}>Bénéficiaires de mon canton →</Text>
          </TouchableOpacity>
        </View>
      }
      ListEmptyComponent={!chargement ? (
        <Text style={styles.vide}>{erreur || "Aucune demande pour l'instant."}</Text>
      ) : null}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.carte}
          onPress={() => navigation.navigate('DetailDemande', { demandeId: item.id })}
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
  contenu: { padding: 20 },
  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  lienRemboursements: { backgroundColor: couleurs.blanc, borderRadius: 8, padding: 12, marginBottom: 16 },
  boutonNouvelleDemande: { backgroundColor: couleurs.vertFonce, borderRadius: 8, padding: 12, marginBottom: 10 },
  texteBoutonNouvelleDemande: { color: couleurs.blanc, fontWeight: '600', fontSize: 13, textAlign: 'center' },
  texteLienRemboursements: { color: couleurs.vertFonce, fontWeight: '600', fontSize: 13 },
  titre: { flex: 1, fontSize: 20, fontWeight: '700', color: couleurs.vertFonce, marginRight: 10 },
  deconnexion: { color: couleurs.brique, fontSize: 13, flexShrink: 0 },
  vide: { textAlign: 'center', color: '#888', marginTop: 20 },
  carte: { flexDirection: 'row', backgroundColor: couleurs.blanc, borderRadius: 10, padding: 14, marginBottom: 10, alignItems: 'center' },
  code: { fontWeight: '700', color: couleurs.grisTexte },
  objet: { fontSize: 13, color: '#555', marginTop: 2, marginBottom: 4 },
  montant: { fontWeight: '600', color: couleurs.vertMoyen },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8 },
  texteBadge: { color: couleurs.blanc, fontSize: 10, fontWeight: '600', textAlign: 'center' },
});
