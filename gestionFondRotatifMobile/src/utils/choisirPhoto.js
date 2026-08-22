import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/**
 * Propose à l'utilisateur de prendre une photo en direct OU d'en
 * choisir une déjà présente dans la galerie du téléphone — utilisé pour
 * la photo de bénéficiaire (CreerDemandeScreen et
 * ListeBeneficiairesScreen), pour ne pas obliger à filmer en direct à
 * chaque fois (ex: photo déjà prise plus tôt, ou reprise d'une photo
 * existante depuis un autre appareil transférée dans la galerie).
 *
 * @returns {Promise<{uri: string, type: string, name: string} | null>}
 *   null si l'utilisateur annule ou refuse la permission — dans ce cas
 *   l'appelant ne doit rien changer à la photo actuelle.
 */
export function choisirPhoto() {
  return new Promise((resolve) => {
    Alert.alert(
      'Photo du bénéficiaire',
      'Prendre une nouvelle photo ou en choisir une dans la galerie ?',
      [
        { text: 'Annuler', style: 'cancel', onPress: () => resolve(null) },
        { text: 'Galerie', onPress: async () => resolve(await choisirDansGalerie()) },
        { text: 'Appareil photo', onPress: async () => resolve(await prendreEnDirect()) },
      ]
    );
  });
}

async function prendreEnDirect() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission requise', "L'accès à l'appareil photo est nécessaire pour prendre la photo.");
    return null;
  }
  const resultat = await ImagePicker.launchCameraAsync({ quality: 0.5, allowsEditing: false });
  return extraireFichier(resultat);
}

async function choisirDansGalerie() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission requise', "L'accès à la galerie est nécessaire pour choisir une photo.");
    return null;
  }
  const resultat = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.5,
    allowsEditing: false,
  });
  return extraireFichier(resultat);
}

function extraireFichier(resultat) {
  if (resultat.canceled || !resultat.assets?.[0]) return null;
  const image = resultat.assets[0];
  // L'extension d'origine est conservée quand elle est connue (une photo
  // de galerie peut être en .png), avec .jpg en repli par défaut.
  const extension = image.uri.split('.').pop()?.toLowerCase();
  const type = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';
  const nom = `photo.${['png', 'webp'].includes(extension) ? extension : 'jpg'}`;
  return { uri: image.uri, type, name: nom };
}
