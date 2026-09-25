import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Chave única do token JWT no SecureStore.
// (SecureStore só aceita chaves alfanuméricas + . _ -)
const TOKEN_KEY = "petjoyful_token";

export const tokenStorage = {
  async getToken(): Promise<string | null> {
    if (Platform.OS === "web") {
      return typeof localStorage === "undefined"
        ? null
        : localStorage.getItem(TOKEN_KEY);
    }

    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.setItem(TOKEN_KEY, token);
      return;
    }

    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  async removeToken(): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.removeItem(TOKEN_KEY);
      return;
    }

    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};
