import axios, { AxiosError } from "axios";
import { tokenStorage } from "@/services/tokenStorage";
import type {
  ProfessionalProfile,
  ProfessionalProfileUpdate,
  ProfilePhotoUpload,
  ProfileApiResponse,
} from "@/types/profile";

const PROFILE_URL =
  process.env.EXPO_PUBLIC_PROFILE_API_URL ||
  "https://edicao-perfil-microservice.onrender.com";

const profileClient = axios.create({
  baseURL: `${PROFILE_URL}/api/profile`,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

profileClient.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

export function getProfileErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : "Não foi possível acessar o perfil.";
  }
  const requestError = error as AxiosError<{ message?: string; error?: string; errors?: Array<{ msg?: string }> }>;
  if (requestError.code === "ECONNABORTED") return "O serviço de perfil demorou para responder.";
  if (!requestError.response) return "Sem conexão com o serviço de perfil.";
  return requestError.response.data?.errors?.[0]?.msg || requestError.response.data?.message || requestError.response.data?.error || "Erro ao acessar o perfil.";
}

export const profileApi = {
  async getMyProfile(): Promise<ProfessionalProfile | null> {
    try {
      const response = await profileClient.get<ProfileApiResponse<ProfessionalProfile>>("/me");
      return response.data.data || null;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) return null;
      throw error;
    }
  },

  async updateMyProfile(data: ProfessionalProfileUpdate): Promise<ProfessionalProfile> {
    const response = await profileClient.put<ProfileApiResponse<ProfessionalProfile>>("/me", data);
    if (!response.data.data) throw new Error(response.data.message || "O perfil não foi retornado pelo serviço.");
    return response.data.data;
  },

  async uploadProfilePhoto(photo: ProfilePhotoUpload): Promise<string> {
    const formData = new FormData();
    if (photo.file) {
      formData.append("foto", photo.file, photo.name);
    } else {
      formData.append("foto", {
        uri: photo.uri,
        name: photo.name,
        type: photo.type,
      } as unknown as Blob);
    }
    const response = await profileClient.post<ProfileApiResponse<{ foto_perfil: string }>>("/me/photo", formData);
    const photoUrl = response.data.data?.foto_perfil;
    if (!photoUrl) throw new Error(response.data.message || "O serviço não retornou a foto atualizada.");
    return photoUrl;
  },
};
