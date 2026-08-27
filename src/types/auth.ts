// Tipos alinhados ao contrato real do backend Express
// (Pet-Joyful-Backend: src/controllers/authController.ts, src/types/index.ts)

// UI: as 3 opções que o usuário escolhe no app (telas de cadastro)
export type TipoRegistro = "adotante" | "ong" | "veterinario";

// Backend: enum UserTipo real (src/types/index.ts). "ong" e "veterinario"
// NÃO existem aqui ainda — é o bug conhecido que api.ts contorna.
export type UserTipoBackend = "adotante" | "cliente" | "admin";

// Formato de usuário retornado por /register e /login
export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  tipo: UserTipoBackend | string;
}

// Formato de usuário retornado por GET /me (userModel completo, sem "senha")
export interface ProfileUser extends AuthUser {
  [key: string]: unknown;
}

export interface RegisterPayload {
  nome: string;
  email: string;
  senha: string;
  tipo: TipoRegistro;
  // Coletados na UI mas ainda não persistidos pelo backend (bug conhecido:
  // userModel não tem esses campos). Enviados mesmo assim, com os mesmos
  // nomes de chave que o frontend Next.js já usa (cpf/cnpj/crmv), pois o
  // controller os ignora silenciosamente — fica pronto para quando o
  // backend for corrigido.
  cpf?: string;
  cnpj?: string;
  crmv?: string;
}

export interface LoginPayload {
  email: string;
  senha: string;
}

export interface AuthResponse {
  message?: string;
  token: string;
  user: AuthUser;
}

export interface ProfileResponse {
  user: ProfileUser;
}

export interface UpdateProfilePayload {
  nome?: string;
  email?: string;
  senha?: string;
  tipo?: TipoRegistro;
}

export interface UpdateProfileResponse {
  message: string;
  user: ProfileUser;
}

export interface DeleteProfileResponse {
  message: string;
}

// Formato de erro real do backend: res.status(xxx).json({ error: "..." })
export interface BackendErrorBody {
  error?: string;
  message?: string;
}
