export type PostCategory =
  'foto' | 'adocao' | 'perdido' | 'encontrado' | 'dica' | 'evento' | 'outros';

export interface PostComment {
  _id: string;
  userId: string;
  nome: string;
  texto: string;
  data: string;
}

export interface CommunityPost {
  _id: string;
  titulo: string;
  descricao?: string;
  imagem?: { url?: string | null } | null;
  categoria: PostCategory;
  tags?: string[];
  autor: { userId: string; nome: string; email: string };
  likes: string[];
  comentarios: PostComment[];
  createdAt: string;
}

export interface PostsResponse {
  success: boolean;
  data: CommunityPost[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface PostImageUpload {
  uri: string;
  name: string;
  type: string;
  file?: Blob;
}

export interface CreatePostPayload {
  titulo: string;
  descricao: string;
  categoria: PostCategory;
  autorNome: string;
  imagem?: PostImageUpload;
}
