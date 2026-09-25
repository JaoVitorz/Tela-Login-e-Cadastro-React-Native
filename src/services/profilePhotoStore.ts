import { useSyncExternalStore } from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

let currentPhoto: string | null = null;
const listeners = new Set<() => void>();

function storageKey(userId: string) {
  return `petjoyful_profile_photo_${userId}`;
}

export function setProfilePhoto(photo: string | null) {
  currentPhoto = photo;
  listeners.forEach((listener) => listener());
}

export function useProfilePhoto() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => currentPhoto,
    () => currentPhoto,
  );
}

export async function getStoredProfilePhoto(userId: string) {
  if (!userId) return null;
  const key = storageKey(userId);
  if (Platform.OS === "web") {
    return typeof localStorage === "undefined" ? null : localStorage.getItem(key);
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function persistProfilePhoto(userId: string, photo: string) {
  if (!userId || !photo) return;
  const key = storageKey(userId);
  if (Platform.OS === "web") {
    localStorage.setItem(key, photo);
    return;
  }
  await SecureStore.setItemAsync(key, photo);
}
