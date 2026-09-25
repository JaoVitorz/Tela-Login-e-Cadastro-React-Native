import axios, { AxiosError } from "axios";
import { tokenStorage } from "@/services/tokenStorage";
import type {
  CreateEventPayload,
  EventsResponse,
  EventStatus,
  EventType,
  PetEvent,
} from "@/types/events";

const EVENTS_URL =
  process.env.EXPO_PUBLIC_EVENTS_API_URL ||
  "https://pet-joyful-events-service.onrender.com";

export const eventsClient = axios.create({
  baseURL: `${EVENTS_URL}/api/events`,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

eventsClient.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function getEventsErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error
      ? error.message
      : "Não foi possível carregar os eventos.";
  }
  const axiosError = error as AxiosError<{
    message?: string;
    error?: string;
    errors?: Array<{ msg?: string }>;
  }>;
  if (axiosError.code === "ECONNABORTED") {
    return "O serviço demorou para responder. Tente novamente.";
  }
  if (!axiosError.response) {
    return "Sem conexão com o serviço de eventos.";
  }
  return (
    axiosError.response.data?.errors?.[0]?.msg ||
    axiosError.response.data?.message ||
    axiosError.response.data?.error ||
    "Erro ao acessar os eventos."
  );
}

export const eventsApi = {
  async list(params?: {
    page?: number;
    limit?: number;
    status?: EventStatus;
    eventType?: EventType;
    city?: string;
  }): Promise<EventsResponse> {
    const response = await eventsClient.get<EventsResponse>("", { params });
    return response.data;
  },

  async create(payload: CreateEventPayload): Promise<PetEvent> {
    const token = await tokenStorage.getToken();
    if (!token) {
      throw new Error("Sua sessão não foi encontrada. Faça login novamente antes de publicar.");
    }
    const response = await eventsClient.post<{ data: PetEvent }>("", payload);
    return response.data.data;
  },

  async getById(id: string): Promise<PetEvent> {
    const response = await eventsClient.get<{ data: PetEvent }>(`/${id}`);
    return response.data.data;
  },

  async update(id: string, payload: CreateEventPayload): Promise<PetEvent> {
    const token = await tokenStorage.getToken();
    if (!token) {
      throw new Error("Sua sessão não foi encontrada. Faça login novamente.");
    }
    const response = await eventsClient.put<{ data: PetEvent }>(`/${id}`, payload);
    return response.data.data;
  },

  async register(id: string): Promise<PetEvent> {
    const response = await eventsClient.post<{ data: PetEvent }>(
      `/${id}/register`,
    );
    return response.data.data;
  },

  async unregister(id: string): Promise<void> {
    await eventsClient.post(`/${id}/unregister`);
  },

  async delete(id: string): Promise<void> {
    const token = await tokenStorage.getToken();
    if (!token) {
      throw new Error("Sua sessão não foi encontrada. Faça login novamente.");
    }
    await eventsClient.delete(`/${id}`);
  },
};
