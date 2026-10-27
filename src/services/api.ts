import { tokenStorage } from '@/services/tokenStorage';
import type {
  AuthResponse,
  MfaChallengeResponse,
  MfaProof,
  MfaSetupResponse,
  BackendErrorBody,
  DeleteProfileResponse,
  LoginPayload,
  LoginResponse,
  ProfileResponse,
  RegisterPayload,
  TipoRegistro,
  UpdateProfilePayload,
  UpdateProfileResponse,
  UserTipoBackend,
} from '@/types/auth';
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

// Backend Principal Pet-Joyful (mesmo backend do frontend Next.js)
// URL de produção:
// https://pet-joyful-backend.onrender.com
// Para usar um servidor local, defina EXPO_PUBLIC_API_URL no arquivo .env.
// Observações:
// - Em emulador Android use 10.0.2.2:5000 (emulador padrão) ou o IP da máquina.
// - Em dispositivo físico, use o IP da sua máquina (ex: http://192.168.0.10:5000).
const DEFAULT_PROD = 'https://pet-joyful-backend.onrender.com';
const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_PROD).replace(/\/+$/, '');

export const api = axios.create({
  baseURL: `${API_URL}/api/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000, // Permite o cold start do serviço na primeira requisição.
});

// Anexa o token JWT salvo no SecureStore em toda requisição autenticada
api.interceptors.request.use(async (config) => {
  if (['/login', '/register', '/mfa/verify'].includes(config.url || '')) return config;
  const token = await tokenStorage.getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshInFlight: Promise<string | null> | null = null;

api.interceptors.response.use((response) => response, async (error: AxiosError<BackendErrorBody>) => {
  const original = error.config as
    | (InternalAxiosRequestConfig & { _retried?: boolean })
    | undefined;
  if (error.response?.status !== 401 || !original || original._retried || original.url?.includes('/refresh')) {
    return Promise.reject(error);
  }

  original._retried = true;
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) return null;
      try {
        const response = await axios.post<{ token: string; refreshToken: string }>(
          `${API_URL}/api/auth/refresh`,
          { refreshToken },
          { timeout: 45000 },
        );
        await tokenStorage.setTokens(response.data.token, response.data.refreshToken);
        return response.data.token;
      } catch {
        await tokenStorage.removeToken();
        return null;
      }
    })().finally(() => { refreshInFlight = null; });
  }

  const token = await refreshInFlight;
  if (token) {
    original.headers = original.headers ?? {};
    original.headers.Authorization = `Bearer ${token}`;
    return api.request(original);
  }

  const message = error.response.data?.error;
  const invalidSession = [
    'Token inválido',
    'Token ausente ou inválido',
    'Conta ou sessão indisponível',
    'Não autenticado',
  ].includes(message || '');
  const currentToken = await tokenStorage.getToken();
  if (invalidSession && currentToken && original.headers?.Authorization === `Bearer ${currentToken}`) {
    await tokenStorage.removeToken();
  }
  return Promise.reject(error);
});

// Bug conhecido do backend: UserTipo só aceita adotante | cliente | admin
// (src/types/index.ts). "ong" e "veterinario" ainda não existem no enum.
// Workaround temporário: mapear para "cliente" até o backend ser corrigido.
function toBackendTipo(tipo: TipoRegistro): UserTipoBackend {
  if (tipo === 'adotante') return 'adotante';
  return 'cliente'; // ong | veterinario
}

// Extrai uma mensagem de erro amigável, cobrindo os mesmos casos já
// tratados no proxy do Next.js (timeout, rede, cold start do Render).
export function extractApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : 'Erro inesperado. Tente novamente.';
  }

  const axiosError = error as AxiosError<BackendErrorBody>;

  if (axiosError.code === 'ECONNABORTED') {
    return 'Tempo de conexão esgotado. Tente novamente.';
  }

  if (!axiosError.response) {
    return 'Erro ao conectar com o servidor. Verifique sua conexão.';
  }

  const { status, data } = axiosError.response;
  const backendMessage = data?.error || data?.message;

  if (backendMessage) {
    return backendMessage;
  }

  if (status === 401) {
    return 'Credenciais inválidas.';
  }

  if (status === 500) {
    return 'O servidor pode estar em cold start (primeira requisição após inatividade leva ~30s). Aguarde e tente novamente.';
  }

  return `Erro ${status}. Tente novamente.`;
}

export const authApi = {
  async register(data: RegisterPayload): Promise<AuthResponse> {
    const payload = {
      nome: data.nome.trim(),
      email: data.email.trim().toLowerCase(),
      senha: data.senha,
      tipo: toBackendTipo(data.tipo),
      ...(data.cpf ? { cpf: data.cpf.replace(/\D/g, '') } : {}),
    };
    const response = await api.post<AuthResponse>('/register', payload);
    return response.data;
  },

  async login(data: LoginPayload): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/login', {
      email: data.email.trim().toLowerCase(),
      senha: data.senha,
    });
    return response.data;
  },

  async getSession(): Promise<{ active: boolean; userId: string }> {
    return (await api.get('/session')).data;
  },

  async verifyMfa(
    challengeToken: string,
    proof: { code?: string; recoveryCode?: string },
  ): Promise<AuthResponse> {
    return (await api.post<AuthResponse>('/mfa/verify', { challengeToken, ...proof })).data;
  },

  async getMfaStatus(): Promise<{ enabled: boolean }> {
    return (await api.get('/mfa')).data;
  },

  async setupMfa(password: string): Promise<MfaSetupResponse> {
    return (await api.post('/mfa/setup', { password })).data;
  },

  async cancelMfaSetup(): Promise<void> {
    await api.delete('/mfa/setup');
  },

  async confirmMfa(
    code: string,
  ): Promise<AuthResponse & { enabled: boolean; recoveryCodes: string[] }> {
    return (await api.post('/mfa/confirm', { code })).data;
  },

  async disableMfa(proof: MfaProof): Promise<AuthResponse & { enabled: boolean }> {
    return (await api.post('/mfa/disable', proof)).data;
  },

  async regenerateMfaCodes(proof: MfaProof): Promise<AuthResponse & { recoveryCodes: string[] }> {
    return (await api.post('/mfa/recovery-codes', proof)).data;
  },

  async getProfile(): Promise<ProfileResponse> {
    const response = await api.get<ProfileResponse>('/me');
    return response.data;
  },

  async updateProfile(data: UpdateProfilePayload): Promise<UpdateProfileResponse> {
    const payload = {
      ...data,
      tipo: data.tipo ? toBackendTipo(data.tipo) : undefined,
    };
    const response = await api.put<UpdateProfileResponse>('/me', payload);
    return response.data;
  },

  async deleteProfile(): Promise<DeleteProfileResponse> {
    const response = await api.delete<DeleteProfileResponse>('/me');
    return response.data;
  },
};
