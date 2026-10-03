import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface CoverPhoto {
  uri: string;
  type: string;
  file?: Blob;
}

function storageKey(userId: string) {
  return `petjoyful_profile_cover_${userId}`;
}

async function readAsDataUrl(photo: CoverPhoto): Promise<string> {
  const blob = photo.file || (await (await fetch(photo.uri)).blob());
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem escolhida.'));
    reader.readAsDataURL(blob);
  });
}

export async function getStoredProfileCover(userId: string): Promise<string | null> {
  if (!userId) return null;
  const key = storageKey(userId);
  if (Platform.OS === 'web') {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  }
  const uri = await SecureStore.getItemAsync(key);
  if (!uri) return null;
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists ? uri : null;
}

export async function persistProfileCover(userId: string, photo: CoverPhoto): Promise<string> {
  if (!userId) throw new Error('Não foi possível identificar a sua conta.');
  const key = storageKey(userId);

  if (Platform.OS === 'web') {
    const dataUrl = await readAsDataUrl(photo);
    try {
      localStorage.setItem(key, dataUrl);
    } catch {
      throw new Error('A imagem é grande demais para salvar neste navegador.');
    }
    return dataUrl;
  }

  if (!FileSystem.documentDirectory) {
    throw new Error('O armazenamento de imagens não está disponível neste dispositivo.');
  }
  const folder = `${FileSystem.documentDirectory}profile-covers/`;
  await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
  const extensionByType: Record<string, string> = {
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
  };
  const extension = extensionByType[photo.type] || 'jpg';
  const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const destination = `${folder}${safeUserId}-${Date.now()}.${extension}`;
  const previous = await SecureStore.getItemAsync(key);
  await FileSystem.copyAsync({ from: photo.uri, to: destination });
  try {
    await SecureStore.setItemAsync(key, destination);
  } catch (error) {
    await FileSystem.deleteAsync(destination, { idempotent: true });
    throw error;
  }
  if (previous && previous !== destination) {
    await FileSystem.deleteAsync(previous, { idempotent: true }).catch(() => {});
  }
  return destination;
}

export async function removeStoredProfileCover(userId: string): Promise<void> {
  if (!userId) return;
  const key = storageKey(userId);
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  const uri = await SecureStore.getItemAsync(key);
  await SecureStore.deleteItemAsync(key);
  if (uri) await FileSystem.deleteAsync(uri, { idempotent: true });
}
