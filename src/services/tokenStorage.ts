import * as SecureStore from "expo-secure-store";

// Chave única do token JWT no SecureStore.
// (SecureStore só aceita chaves alfanuméricas + . _ -)
const TOKEN_KEY = "petjoyful_token";

export const tokenStorage = {
  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  async removeToken(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};
