import { tokenStorage } from "@/services/tokenStorage";
import type {
  AuthResponse,
  BackendErrorBody,
  DeleteProfileResponse,
  LoginPayload,
  ProfileResponse,
  RegisterPayload,
  TipoRegistro,
  UpdateProfilePayload,
  UpdateProfileResponse,
  UserTipoBackend,
} from "@/types/auth";
import axios, { AxiosError } from "axios";

// Backend Principal Pet-Joyful (mesmo backend do frontend Next.js)
// URL de produção:
// https://pet-joyful-backend.onrender.com
// Em desenvolvimento, permitimos apontar para o servidor local (localhost:5000).
// Observações:
// - Em emulador Android use 10.0.2.2:5000 (emulador padrão) ou o IP da máquina.
// - Em dispositivo físico, use o IP da sua máquina (ex: http://192.168.0.10:5000).
const DEFAULT_PROD = "https://pet-joyful-backend.onrender.com";
const DEV_LOCAL = "http://localhost:5000";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || (typeof __DEV__ !== 'undefined' && __DEV__ ? DEV_LOCAL : DEFAULT_PROD);

export const api = axios.create({
  baseURL: `${API_URL}/api/auth`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // Render free tier tem cold start (~30s na 1a requisição)
});

// Anexa o token JWT salvo no SecureStore em toda requisição autenticada
api.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Bug conhecido do backend: UserTipo só aceita adotante | cliente | admin
// (src/types/index.ts). "ong" e "veterinario" ainda não existem no enum.
// Workaround temporário: mapear para "cliente" até o backend ser corrigido.
function toBackendTipo(tipo: TipoRegistro): UserTipoBackend {
  if (tipo === "adotante") return "adotante";
  return "cliente"; // ong | veterinario
}

// Extrai uma mensagem de erro amigável, cobrindo os mesmos casos já
// tratados no proxy do Next.js (timeout, rede, cold start do Render).
export function extractApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "Erro inesperado. Tente novamente.";
  }

  const axiosError = error as AxiosError<BackendErrorBody>;

  if (axiosError.code === "ECONNABORTED") {
    return "Tempo de conexão esgotado. Tente novamente.";
  }

  if (!axiosError.response) {
    return "Erro ao conectar com o servidor. Verifique sua conexão.";
  }

  const { status, data } = axiosError.response;
  const backendMessage = data?.error || data?.message;

  if (backendMessage) {
    return backendMessage;
  }

  if (status === 401) {
    return "Credenciais inválidas.";
  }

  if (status === 500) {
    return "O servidor pode estar em cold start (primeira requisição após inatividade leva ~30s). Aguarde e tente novamente.";
  }

  return `Erro ${status}. Tente novamente.`;
}

export const authApi = {
  async register(data: RegisterPayload): Promise<AuthResponse> {
    const payload = {
      nome: data.nome,
      email: data.email,
      senha: data.senha,
      tipo: toBackendTipo(data.tipo),
      // Enviados mesmo sem persistência no backend ainda (ver types/auth.ts)
      cpf: data.cpf,
      cnpj: data.cnpj,
      crmv: data.crmv,
    };
    const response = await api.post<AuthResponse>("/register", payload);
    return response.data;
  },

  async login(data: LoginPayload): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/login", data);
    return response.data;
  },

  async getProfile(): Promise<ProfileResponse> {
    const response = await api.get<ProfileResponse>("/me");
    return response.data;
  },

  async updateProfile(
    data: UpdateProfilePayload,
  ): Promise<UpdateProfileResponse> {
    const payload = {
      ...data,
      tipo: data.tipo ? toBackendTipo(data.tipo) : undefined,
    };
    const response = await api.put<UpdateProfileResponse>("/me", payload);
    return response.data;
  },

  async deleteProfile(): Promise<DeleteProfileResponse> {
    const response = await api.delete<DeleteProfileResponse>("/me");
    return response.data;
  },
};
