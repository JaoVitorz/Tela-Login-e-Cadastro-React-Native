export interface ProfessionalProfile {
  _id?: string;
  userId?: string;
  nome: string;
  email?: string;
  telefone?: string;
  data_nascimento?: string;
  tipo_usuario?: "tutor" | "instituicao" | "clinica" | string;
  foto_perfil?: string;
  bio?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ProfessionalProfileUpdate = Partial<
  Pick<
    ProfessionalProfile,
    | "nome"
    | "telefone"
    | "data_nascimento"
    | "bio"
    | "cidade"
    | "estado"
    | "cep"
    | "endereco"
    | "numero"
    | "complemento"
  >
>;

export interface ProfilePhotoUpload {
  uri: string;
  name: string;
  type: string;
  file?: Blob;
}

export interface ProfileApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
