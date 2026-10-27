import axios from 'axios';
import { io, type Socket } from 'socket.io-client';
import { tokenStorage } from '@/services/tokenStorage';

const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://pet-joyful-backend.onrender.com').replace(/\/+$/, '');
const client = axios.create({ baseURL: `${API_URL}/api/chat`, timeout: 30000 });
client.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export type ChatUser = { id: string; name: string; nome?: string; tipo?: string };
export type DirectMessage = { id: string; senderId: string; text: string; createdAt: string };
export type DirectConversation = {
  id: string;
  user: ChatUser;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount?: number;
};
export type DirectMessageEvent = {
  conversationId: string;
  senderName?: string;
  message: DirectMessage;
};

export const directChatApi = {
  async users(q: string) {
    const { data } = await client.get<{ users: ChatUser[] }>('/users', { params: { q } });
    return data.users || [];
  },
  async conversations() {
    const { data } = await client.get<{ conversations: DirectConversation[] }>('/conversations');
    return data.conversations || [];
  },
  async createConversation(userId: string) {
    const { data } = await client.post<{ conversation: DirectConversation }>('/conversations', { userId });
    return data.conversation;
  },
  async messages(conversationId: string) {
    const { data } = await client.get<{ messages: DirectMessage[] }>(`/conversations/${encodeURIComponent(conversationId)}/messages`, { params: { limit: 100 } });
    return data.messages || [];
  },
  async markRead(conversationId: string) {
    await client.post(`/conversations/${encodeURIComponent(conversationId)}/read`, {});
  },
  async send(conversationId: string, text: string) {
    const { data } = await client.post<{ message: DirectMessage }>(`/conversations/${encodeURIComponent(conversationId)}/messages`, { text });
    return data.message;
  },
  async connect(onMessage: (event: DirectMessageEvent) => void): Promise<Socket | null> {
    const token = await tokenStorage.getToken();
    if (!token) return null;
    const socket = io(API_URL, { auth: { token }, transports: ['websocket', 'polling'], reconnection: true });
    socket.on('direct-message:new', onMessage);
    return socket;
  },
};
