import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Chave única do token JWT no SecureStore.
// (SecureStore só aceita chaves alfanuméricas + . _ -)
const TOKEN_KEY = 'petjoyful_token';
const REFRESH_TOKEN_KEY = 'petjoyful_refresh_token';
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

  async getRefreshToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return typeof localStorage === 'undefined' ? null : localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setTokens(token: string, refreshToken?: string): Promise<void> {
    await this.setToken(token);
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        else localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
      return;
    }
    if (refreshToken) await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    else await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
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
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
      sessionChanged();
      return;
    }

    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
    sessionChanged();
  },
};
