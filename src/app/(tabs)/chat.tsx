import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ArrowUp, MessageCircle, Search, UserRound, X } from 'lucide-react-native';
import { directChatApi, type ChatUser, type DirectConversation, type DirectMessage, type DirectMessageEvent } from '@/services/directChatApi';
import { markConversationNotificationsRead } from '@/services/notificationStore';
import { colors } from '@/theme/colors';
import { authApi } from '@/services/api';

const nameOf = (user?: ChatUser) => user?.name || user?.nome || 'Pessoa da comunidade';
const clock = (value: string) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); };

export default function ChatScreen() {
  const params = useLocalSearchParams<{ conversationId?: string | string[] }>();
  const conversationId = Array.isArray(params.conversationId) ? params.conversationId[0] : params.conversationId;
  const [currentUserId, setCurrentUserId] = useState('');
  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [contactResults, setContactResults] = useState<ChatUser[]>([]);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<FlatList<DirectMessage> | null>(null);
  const activeConversation = useMemo(() => conversations.find((item) => item.id === conversationId), [conversations, conversationId]);
  const loadConversations = useCallback(async () => { try { setConversations(await directChatApi.conversations()); } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível carregar as conversas.'); } }, []);

  useEffect(() => {
    let active = true;
    void authApi.getProfile().then(({ user }) => { if (active) setCurrentUserId(user.id || user._id || ''); }).catch(() => {});
    void loadConversations().finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loadConversations]);

  useEffect(() => {
    if (!searching) return;
    let active = true;
    const timer = setTimeout(() => { void directChatApi.users(search.trim()).then((users) => { if (active) setContactResults(users); }).catch(() => { if (active) setError('Não foi possível buscar pessoas agora.'); }); }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [search, searching]);

  useEffect(() => {
    if (!conversationId) return;
    let active = true;
    const load = async () => {
      try {
        const result = await directChatApi.messages(conversationId);
        if (active) setMessages(result);
        await directChatApi.markRead(conversationId);
        markConversationNotificationsRead(conversationId);
        await loadConversations();
      } catch (e) { if (active) setError(e instanceof Error ? e.message : 'Não foi possível carregar as mensagens.'); }
    };
    setLoading(true); void load().finally(() => { if (active) setLoading(false); });
    const timer = setInterval(() => { void directChatApi.messages(conversationId).then((result) => { if (active) setMessages(result); }).catch(() => {}); }, 12000);
    let socket: { on: (event: string, handler: (event: DirectMessageEvent) => void) => void; disconnect: () => void } | null = null;
    void directChatApi.connect((event) => {
      if (event.conversationId !== conversationId || !active) return;
      setMessages((old) => old.some((item) => item.id === event.message.id) ? old : [...old, event.message]);
      if (event.message.senderId !== currentUserId) void directChatApi.markRead(conversationId).catch(() => {});
    }).then((connected) => { socket = connected; });
    return () => { active = false; clearInterval(timer); socket?.disconnect(); };
  }, [conversationId, currentUserId, loadConversations]);

  async function openUser(user: ChatUser) {
    try { const conversation = await directChatApi.createConversation(user.id); await loadConversations(); setSearching(false); setSearch(''); router.replace({ pathname: '/(tabs)/chat' as never, params: { conversationId: conversation.id } } as never); }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível abrir a conversa.'); }
  }
  async function sendMessage() {
    const text = draft.trim(); if (!text || !conversationId || sending) return;
    setSending(true); setDraft(''); setError('');
    try { const message = await directChatApi.send(conversationId, text); setMessages((old) => old.some((item) => item.id === message.id) ? old : [...old, message]); await loadConversations(); }
    catch (e) { setDraft(text); setError(e instanceof Error ? e.message : 'Não foi possível enviar a mensagem.'); }
    finally { setSending(false); }
  }

  if (conversationId) return <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={88}>
    <View style={styles.chatTop}><Pressable accessibilityLabel="Voltar para mensagens" onPress={() => router.replace('/(tabs)/chat' as never)} style={styles.back}><ArrowLeft size={22} color={colors.textDark} /></Pressable><View style={styles.avatarSmall}><UserRound color={colors.action} size={20} /></View><View style={styles.topCopy}><Text style={styles.personName}>{nameOf(activeConversation?.user)}</Text><Text style={styles.topHint}>Conversa direta</Text></View></View>
    {loading ? <View style={styles.center}><ActivityIndicator color={colors.action} /></View> : <FlatList ref={listRef} style={styles.messageList} contentContainerStyle={styles.messageContent} data={messages} keyExtractor={(item) => item.id} onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })} ListEmptyComponent={<Text style={styles.emptyHint}>Esta conversa começou agora. Envie uma mensagem para iniciar.</Text>} renderItem={({ item }) => { const mine = item.senderId === currentUserId; return <View style={[styles.messageRow, mine ? styles.mineRow : styles.theirRow]}><View style={[styles.bubble, mine ? styles.mineBubble : styles.theirBubble]}><Text style={[styles.messageText, mine && styles.mineText]}>{item.text}</Text><Text style={[styles.time, mine && styles.mineTime]}>{clock(item.createdAt)}</Text></View></View>; }} />}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <View style={styles.composer}><TextInput value={draft} onChangeText={setDraft} placeholder="Escreva uma mensagem..." placeholderTextColor="#8b938e" style={styles.input} multiline maxLength={2000} onSubmitEditing={() => { if (Platform.OS === 'web') void sendMessage(); }} /><Pressable accessibilityLabel="Enviar mensagem" disabled={!draft.trim() || sending} onPress={() => void sendMessage()} style={[styles.send, (!draft.trim() || sending) && styles.sendDisabled]}>{sending ? <ActivityIndicator color="white" size="small" /> : <ArrowUp color="white" size={21} />}</Pressable></View>
  </KeyboardAvoidingView>;

  return <View style={styles.page}>
    <View style={styles.inboxHeader}><View><Text style={styles.title}>Mensagens</Text><Text style={styles.subtitle}>Converse com a comunidade PetJoyful</Text></View><Pressable accessibilityLabel="Nova conversa" onPress={() => { setSearching(true); setError(''); }} style={styles.newChat}><MessageCircle size={20} color="white" /></Pressable></View>
    <View style={styles.searchBox}><Search size={18} color="#758078" /><TextInput value={search} onChangeText={setSearch} onFocus={() => setSearching(true)} placeholder="Buscar pessoas" placeholderTextColor="#89918b" style={styles.searchInput} /><Pressable accessibilityLabel="Buscar pessoas" onPress={() => setSearching(true)}><Text style={styles.searchAction}>{searching ? 'Buscar' : ''}</Text></Pressable>{searching && <Pressable accessibilityLabel="Fechar busca" onPress={() => { setSearching(false); setSearch(''); }}><X size={18} color="#758078" /></Pressable>}</View>
    {searching ? <FlatList data={contactResults} keyExtractor={(item) => item.id} keyboardShouldPersistTaps="handled" ListEmptyComponent={<Text style={styles.emptyHint}>{search.trim() ? 'Nenhuma pessoa encontrada.' : 'Digite um nome para encontrar alguém.'}</Text>} renderItem={({ item }) => <Pressable onPress={() => void openUser(item)} style={styles.conversationRow}><View style={styles.avatar}><UserRound size={22} color={colors.action} /></View><View style={styles.rowText}><Text style={styles.personName}>{nameOf(item)}</Text><Text style={styles.preview}>Toque para iniciar uma conversa</Text></View><ArrowUp size={18} color={colors.action} /></Pressable>} /> : loading ? <View style={styles.center}><ActivityIndicator color={colors.action} /></View> : <FlatList data={conversations} keyExtractor={(item) => item.id} renderItem={({ item }) => <Pressable onPress={() => router.push({ pathname: '/(tabs)/chat' as never, params: { conversationId: item.id } } as never)} style={styles.conversationRow}><View style={styles.avatar}><UserRound size={22} color={colors.action} /></View><View style={styles.rowText}><View style={styles.nameLine}><Text style={styles.personName}>{nameOf(item.user)}</Text><Text style={styles.time}>{clock(item.lastMessageAt)}</Text></View><Text style={styles.preview} numberOfLines={1}>{item.lastMessage || 'Inicie a conversa'}</Text></View>{(item.unreadCount || 0) > 0 && <View style={styles.unread}><Text style={styles.unreadText}>{item.unreadCount! > 9 ? '9+' : item.unreadCount}</Text></View>}</Pressable>} ListEmptyComponent={<View style={styles.empty}><View style={styles.emptyIcon}><MessageCircle size={27} color={colors.action} /></View><Text style={styles.emptyTitle}>Suas mensagens</Text><Text style={styles.emptyHint}>Troque dicas e combine cuidados com outras pessoas da comunidade.</Text><Pressable style={styles.primaryButton} onPress={() => setSearching(true)}><Text style={styles.primaryText}>Iniciar conversa</Text></Pressable></View>} />}
    {error && !conversationId ? <Text style={styles.error}>{error}</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f8faf8' },
  inboxHeader: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 25, fontWeight: '800', color: colors.textDark }, subtitle: { marginTop: 4, fontSize: 13, color: colors.textMuted },
  newChat: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.action, alignItems: 'center', justifyContent: 'center' },
  searchBox: { height: 46, marginHorizontal: 16, marginBottom: 10, paddingHorizontal: 13, backgroundColor: '#edf1ed', borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  searchInput: { flex: 1, color: colors.textDark, fontSize: 14, outlineStyle: 'none' as never }, searchAction: { color: colors.action, fontWeight: '700' },
  conversationRow: { paddingHorizontal: 17, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e4e9e4' },
  avatar: { width: 49, height: 49, borderRadius: 25, backgroundColor: '#e4f4e8', alignItems: 'center', justifyContent: 'center' },
  avatarSmall: { width: 39, height: 39, borderRadius: 20, backgroundColor: '#e4f4e8', alignItems: 'center', justifyContent: 'center' }, rowText: { flex: 1 }, nameLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, personName: { fontSize: 15, fontWeight: '700', color: colors.textDark }, preview: { marginTop: 5, color: colors.textMuted, fontSize: 13 },
  unread: { minWidth: 21, height: 21, borderRadius: 11, paddingHorizontal: 5, backgroundColor: colors.action, alignItems: 'center', justifyContent: 'center' }, unreadText: { color: 'white', fontSize: 10, fontWeight: '800' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 34, paddingTop: 90 }, emptyIcon: { width: 60, height: 60, borderRadius: 30, borderWidth: 1.5, borderColor: colors.action, alignItems: 'center', justifyContent: 'center' }, emptyTitle: { marginTop: 18, fontSize: 19, fontWeight: '800', color: colors.textDark }, emptyHint: { color: colors.textMuted, textAlign: 'center', lineHeight: 21, marginTop: 8 },
  primaryButton: { marginTop: 18, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: colors.action, borderRadius: 10 }, primaryText: { color: 'white', fontWeight: '700' }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, error: { color: colors.error, textAlign: 'center', padding: 10 },
  chatTop: { height: 64, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, backgroundColor: 'white', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e5e9e5' }, back: { width: 38, height: 42, alignItems: 'center', justifyContent: 'center' }, topCopy: { gap: 2 }, topHint: { color: colors.textMuted, fontSize: 11 }, messageList: { flex: 1 }, messageContent: { paddingHorizontal: 15, paddingVertical: 18, gap: 10 }, messageRow: { flexDirection: 'row' }, mineRow: { justifyContent: 'flex-end' }, theirRow: { justifyContent: 'flex-start' }, bubble: { maxWidth: '82%', borderRadius: 19, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 7 }, mineBubble: { backgroundColor: colors.action, borderBottomRightRadius: 5 }, theirBubble: { backgroundColor: 'white', borderBottomLeftRadius: 5, borderWidth: 1, borderColor: '#e8ece8' }, messageText: { fontSize: 15, color: colors.textDark, lineHeight: 21 }, mineText: { color: 'white' }, time: { color: '#89918b', fontSize: 10, marginTop: 4, alignSelf: 'flex-end' }, mineTime: { color: 'rgba(255,255,255,.75)' },
  composer: { minHeight: 58, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'flex-end', gap: 9, backgroundColor: 'white', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e5e9e5' }, input: { flex: 1, maxHeight: 110, paddingHorizontal: 15, paddingTop: 12, paddingBottom: 11, borderRadius: 22, backgroundColor: '#f0f3f0', color: colors.textDark, fontSize: 14 }, send: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.action, alignItems: 'center', justifyContent: 'center' }, sendDisabled: { opacity: 0.48 },
});
