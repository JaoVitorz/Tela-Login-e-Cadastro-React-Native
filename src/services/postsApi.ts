import axios, { AxiosError } from 'axios';
import { tokenStorage } from '@/services/tokenStorage';
import type { CommunityPost, CreatePostPayload, PostComment, PostsResponse } from '@/types/posts';

const POSTS_URL = (
  process.env.EXPO_PUBLIC_POSTS_API_URL || 'https://pet-joyful-posts-service.onrender.com'
).replace(/\/+$/, '');

const postsClient = axios.create({
  baseURL: `${POSTS_URL}/api/posts`,
  timeout: 45000,
});

postsClient.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

export function getPostsErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : 'Erro ao acessar as publicações.';
  }
  const requestError = error as AxiosError<{
    message?: string;
    error?: string;
  }>;
  if (requestError.code === 'ECONNABORTED') {
    return 'O serviço de publicações demorou para responder. Tente novamente.';
  }
  if (!requestError.response) {
    return 'Não foi possível conectar ao serviço de publicações.';
  }
  if (requestError.response.status === 401) {
    return 'Sua sessão expirou. Entre novamente para continuar.';
  }
  return (
    requestError.response.data?.message ||
    requestError.response.data?.error ||
    'Não foi possível concluir a operação.'
  );
}

async function requireToken() {
  if (!(await tokenStorage.getToken())) {
    throw new Error('Entre na sua conta para interagir com a comunidade.');
  }
}

export const postsApi = {
  async list(page = 1, limit = 10): Promise<PostsResponse> {
    const response = await postsClient.get<PostsResponse>('', {
      params: { page, limit },
    });
    return response.data;
  },

  async create(payload: CreatePostPayload): Promise<CommunityPost> {
    await requireToken();
    const { imagem, ...fields } = payload;
    let data: CreatePostPayload | FormData = fields;
    if (imagem) {
      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
      if (imagem.file) {
        formData.append('imagem', imagem.file, imagem.name);
      } else {
        formData.append('imagem', {
          uri: imagem.uri,
          name: imagem.name,
          type: imagem.type,
        } as unknown as Blob);
      }
      data = formData;
    }
    const response = await postsClient.post<{ data: CommunityPost }>('', data);
    return response.data.data;
  },

  async update(
    id: string,
    payload: Pick<CreatePostPayload, 'titulo' | 'descricao' | 'categoria'> & {
      imagem?: CreatePostPayload['imagem'];
    },
  ): Promise<CommunityPost> {
    await requireToken();
    const { imagem, ...fields } = payload;
    let data: typeof fields | FormData = fields;
    if (imagem) {
      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
      if (imagem.file) {
        formData.append('imagem', imagem.file, imagem.name);
      } else {
        formData.append('imagem', {
          uri: imagem.uri,
          name: imagem.name,
          type: imagem.type,
        } as unknown as Blob);
      }
      data = formData;
    }
    const response = await postsClient.put<{ data: CommunityPost }>(`/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await requireToken();
    await postsClient.delete(`/${id}`);
  },

  async toggleLike(id: string): Promise<{ liked: boolean; likesCount: number }> {
    await requireToken();
    const response = await postsClient.post<{
      liked: boolean;
      likesCount: number;
    }>(`/${id}/like`);
    return response.data;
  },

  async addComment(id: string, texto: string, autorNome: string): Promise<PostComment> {
    await requireToken();
    const response = await postsClient.post<{ data: PostComment }>(`/${id}/comment`, {
      texto,
      autorNome,
    });
    return response.data.data;
  },
};
