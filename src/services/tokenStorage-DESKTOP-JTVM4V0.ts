import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Chave única do token JWT no SecureStore.
// (SecureStore só aceita chaves alfanuméricas + . _ -)
const TOKEN_KEY = 'petjoyful_token';
const listeners = new Set<() => void>();

export function isAccessToken(token: unknown): token is string {
  return (
    typeof token === 'string' && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)
  );
}

export function subscribeSession(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function sessionChanged() {
  listeners.forEach((listener) => listener());
}

export const tokenStorage = {
  async getToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      const token = typeof localStorage === 'undefined' ? null : localStorage.getItem(TOKEN_KEY);
      return isAccessToken(token) ? token : null;
    }

    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      return isAccessToken(token) ? token : null;
    } catch {
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    if (!isAccessToken(token))
      throw new Error('O servidor não retornou uma sessão válida. Faça login novamente.');
    if (Platform.OS === 'web') {
      localStorage.setItem(TOKEN_KEY, token);
      sessionChanged();
      return;
    }

    await SecureStore.setItemAsync(TOKEN_KEY, token);
    sessionChanged();
  },

  async removeToken(): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEY);
      sessionChanged();
      return;
    }

    await SecureStore.deleteItemAsync(TOKEN_KEY);
    sessionChanged();
  },
};
