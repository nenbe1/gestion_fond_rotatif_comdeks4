import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { BASE_URL } from '../api/client';

const { StorageAccessFramework } = FileSystem;
const CLE_DOSSIER_CHOISI = 'dossierTelechargementsChoisi';

/**
 * Télécharge un reçu PDF (route protégée par token) et l'enregistre
 * durablement :
 * - Android : dans le dossier choisi une fois par l'utilisateur (via le
 *   sélecteur natif — en pratique "Téléchargements"), mémorisé ensuite
 *   pour ne plus jamais redemander. Le fichier reste visible dans le
 *   gestionnaire de fichiers, contrairement au cache qui peut être
 *   effacé par le système à tout moment.
 * - iOS : pas de dossier "Téléchargements" équivalent — on garde le
 *   menu de partage natif (Fichiers, AirDrop, etc.), seule option
 *   disponible sans éjecter du workflow Expo managé.
 * - Si l'utilisateur refuse la permission de dossier (Android) ou en
 *   cas d'erreur, on retombe sur le partage classique plutôt que
 *   d'échouer complètement.
 *
 * @param {number} cotisationId
 * @param {string} codeCotisation Utilisé pour le nom du fichier.
 */
export async function telechargerRecuCotisation(cotisationId, codeCotisation) {
  const token = await AsyncStorage.getItem('token');
  const nomFichier = `recu_${codeCotisation}.pdf`;
  const destinationCache = `${FileSystem.cacheDirectory}${nomFichier}`;

  const resultat = await FileSystem.downloadAsync(
    `${BASE_URL}/cotisations/${cotisationId}/recu`,
    destinationCache,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );

  if (resultat.status !== 200) {
    throw new Error('Impossible de récupérer le reçu.');
  }

  if (Platform.OS === 'android') {
    try {
      let dossierUri = await AsyncStorage.getItem(CLE_DOSSIER_CHOISI);

      if (!dossierUri) {
        const permission = await StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permission.granted) {
          await partager(resultat.uri, nomFichier);
          return;
        }
        dossierUri = permission.directoryUri;
        await AsyncStorage.setItem(CLE_DOSSIER_CHOISI, dossierUri);
      }

      const contenuBase64 = await FileSystem.readAsStringAsync(resultat.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const nouveauFichierUri = await StorageAccessFramework.createFileAsync(dossierUri, nomFichier, 'application/pdf');
      await FileSystem.writeAsStringAsync(nouveauFichierUri, contenuBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      Alert.alert('Reçu enregistré', `"${nomFichier}" a été enregistré dans le dossier choisi.`);
    } catch (erreur) {
      // Cas connu sur Android : le dossier racine "Téléchargements" n'est
      // pas inscriptible directement par les apps (restriction système) —
      // il faut qu'un sous-dossier soit choisi (ex: créer "Reçus MMF"
      // dedans). On oublie le choix invalide et on retombe sur le
      // partage, avec une explication claire pour la prochaine tentative.
      await AsyncStorage.removeItem(CLE_DOSSIER_CHOISI);
      Alert.alert(
        'Dossier non accepté',
        "Le dossier \"Téléchargements\" lui-même ne peut pas être utilisé directement. La prochaine fois, ouvre Téléchargements puis crée un sous-dossier (ex: \"Reçus MMF\") et choisis-le. Ce reçu va s'ouvrir via le partage en attendant."
      );
      await partager(resultat.uri, nomFichier);
    }
  } else {
    // iOS : pas d'équivalent "Téléchargements", le partage reste la
    // seule option pour sortir le fichier du cache de l'app.
    await partager(resultat.uri, nomFichier);
  }
}

async function partager(uri, nomFichier) {
  const partagePossible = await Sharing.isAvailableAsync();
  if (partagePossible) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: nomFichier });
  } else {
    Alert.alert('Reçu téléchargé', `Enregistré ici : ${uri}`);
  }
}
