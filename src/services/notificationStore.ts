import { useSyncExternalStore } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { authApi } from '@/services/api';
import { directChatApi, type DirectMessageEvent } from '@/services/directChatApi';
import { postsApi } from '@/services/postsApi';

export type AppNotification = {
  id: string;
  kind: 'message' | 'post';
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  conversationId?: string;
};

let items: AppNotification[] = [];
let listeners = new Set<() => void>();
let stopCurrent: (() => void) | undefined;
let activeUserId = '';
const storageKey = (userId: string) => `pet-joyful.notifications.${userId}`;
const seenKey = (userId: string) => `pet-joyful.seen-posts.${userId}`;
const snapshot = () => items;
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
function publish(next: AppNotification[]) {
  items = next.slice(0, 50);
  listeners.forEach((listener) => listener());
}
async function readValue<T>(key: string, fallback: T): Promise<T> {
  try {
    if (Platform.OS !== 'web') {
      const raw = await SecureStore.getItemAsync(key);
      return raw ? JSON.parse(raw) as T : fallback;
    }
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) as T : fallback;
    }
  } catch { /* usa valor padrão */ }
  return fallback;
}
async function writeValue(key: string, value: unknown) {
  try {
    const raw = JSON.stringify(value);
    if (Platform.OS !== 'web') await SecureStore.setItemAsync(key, raw);
    else if (typeof localStorage !== 'undefined') localStorage.setItem(key, raw);
  } catch { /* armazenamento opcional */ }
}
async function persist(userId: string) { await writeValue(storageKey(userId), items); }
function addNotification(notification: AppNotification) {
  if (items.some((item) => item.id === notification.id)) return;
  publish([notification, ...items]);
}

export function useNotifications() { return useSyncExternalStore(subscribe, snapshot, snapshot); }

export function markNotificationRead(id: string) {
  publish(items.map((item) => item.id === id ? { ...item, read: true } : item));
  if (activeUserId) void persist(activeUserId);
}
export function markConversationNotificationsRead(conversationId: string) {
  publish(items.map((item) => item.conversationId === conversationId ? { ...item, read: true } : item));
  if (activeUserId) void persist(activeUserId);
}
export function markAllNotificationsRead() { publish(items.map((item) => ({ ...item, read: true }))); if (activeUserId) void persist(activeUserId); }

export async function startNotifications() {
  stopCurrent?.();
  let alive = true;
  let userId = '';
  let socketStop: (() => void) | undefined;
  let poll: ReturnType<typeof setInterval> | undefined;
  try {
    const { user } = await authApi.getProfile();
    userId = user.id || user._id || '';
    activeUserId = userId;
    if (!userId || !alive) return () => { alive = false; };
    const saved = await readValue<AppNotification[]>(storageKey(userId), []);
    if (alive) publish(Array.isArray(saved) ? saved : []);
    const conversations = await directChatApi.conversations().catch(() => []);
    for (const conversation of conversations) {
      if ((conversation.unreadCount || 0) > 0) addNotification({
        id: `conversation:${conversation.id}`, kind: 'message',
        title: conversation.user.name || conversation.user.nome || 'Nova mensagem',
        body: conversation.lastMessage || 'Enviou uma mensagem',
        createdAt: conversation.lastMessageAt || new Date().toISOString(), read: false,
        conversationId: conversation.id,
      });
    }
    let seenPosts = await readValue<string[]>(seenKey(userId), []);
    const checkPosts = async (initial = false) => {
      try {
        const response = await postsApi.list(1, 10);
        const posts = response.data || [];
        const known = new Set(seenPosts);
        if (!initial) posts.forEach((post) => {
          if (!known.has(post._id) && post.autor?.userId !== userId) addNotification({
            id: `post:${post._id}`, kind: 'post', title: post.autor?.nome || 'Nova publicação',
            body: post.titulo || post.descricao || 'Compartilhou uma atualização na comunidade',
            createdAt: post.createdAt, read: false,
          });
        });
        seenPosts = Array.from(new Set([...seenPosts, ...posts.map((post) => post._id)])).slice(-100);
        await writeValue(seenKey(userId), seenPosts);
      } catch { /* serviço de posts pode estar indisponível */ }
    };
    await checkPosts(seenPosts.length === 0);
    const socket = await directChatApi.connect((event: DirectMessageEvent) => {
      if (event.message?.senderId === userId) return;
      publish(items.filter((item) => item.id !== `conversation:${event.conversationId}`));
      addNotification({
        id: `message:${event.message.id}`, kind: 'message',
        title: event.senderName || 'Nova mensagem', body: event.message.text,
        createdAt: event.message.createdAt, read: false, conversationId: event.conversationId,
      });
      void persist(userId);
    });
    socketStop = () => socket?.disconnect();
    poll = setInterval(() => { void checkPosts(); void directChatApi.conversations().then((list) => {
      list.filter((item) => (item.unreadCount || 0) > 0).forEach((item) => addNotification({
        id: `conversation:${item.id}`, kind: 'message', title: item.user.name || item.user.nome || 'Nova mensagem',
        body: item.lastMessage || 'Enviou uma mensagem', createdAt: item.lastMessageAt || new Date().toISOString(),
        read: false, conversationId: item.id,
      }));
    }).catch(() => {}); void persist(userId); }, 15000);
  } catch { /* app continua navegável mesmo sem serviços remotos */ }
  const stop = () => { alive = false; if (poll) clearInterval(poll); socketStop?.(); if (userId) void persist(userId); };
  stopCurrent = stop;
  return stop;
}
