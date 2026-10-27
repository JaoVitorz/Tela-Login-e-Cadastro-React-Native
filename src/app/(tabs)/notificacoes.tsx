import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Bell, Check, MessageCircle, PawPrint } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { markAllNotificationsRead, markNotificationRead, useNotifications, type AppNotification } from '@/services/notificationStore';

export default function NotificationsScreen() {
  const notifications = useNotifications();
  const unread = notifications.some((item) => !item.read);
  function open(item: AppNotification) {
    markNotificationRead(item.id);
    if (item.kind === 'message' && item.conversationId) router.push({ pathname: '/(tabs)/chat' as never, params: { conversationId: item.conversationId } } as never);
    else router.push('/(tabs)' as never);
  }
  return <View style={styles.page}>
    <View style={styles.heading}><View><Text style={styles.title}>Notificações</Text><Text style={styles.subtitle}>Atividade recente da sua comunidade</Text></View>{unread && <Pressable onPress={markAllNotificationsRead} style={styles.readAll}><Check size={15} color={colors.action} /><Text style={styles.readAllText}>Ler tudo</Text></Pressable>}</View>
    <FlatList data={notifications} keyExtractor={(item) => item.id} contentContainerStyle={notifications.length ? styles.list : styles.emptyContainer} ListEmptyComponent={<View style={styles.empty}><View style={styles.emptyIcon}><Bell color={colors.action} size={26} /></View><Text style={styles.emptyTitle}>Tudo em dia</Text><Text style={styles.subtitle}>Quando houver novas mensagens ou publicações, elas aparecerão aqui.</Text></View>} renderItem={({ item }) => {
      const Icon = item.kind === 'message' ? MessageCircle : PawPrint;
      return <Pressable onPress={() => open(item)} style={[styles.row, !item.read && styles.unreadRow]}><View style={styles.icon}><Icon size={21} color={colors.action} /></View><View style={styles.copy}><Text style={styles.itemTitle}>{item.title}</Text><Text style={styles.body} numberOfLines={2}>{item.body}</Text><Text style={styles.date}>{new Date(item.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text></View>{!item.read && <View style={styles.dot} />}</Pressable>;
    }} />
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f8faf8' }, heading: { paddingHorizontal: 20, paddingTop: 19, paddingBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, title: { color: colors.textDark, fontSize: 25, fontWeight: '800' }, subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4 }, readAll: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8 }, readAllText: { color: colors.action, fontSize: 12, fontWeight: '700' }, list: { paddingHorizontal: 12, paddingBottom: 20 }, row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 7, backgroundColor: 'white', borderRadius: 14 }, unreadRow: { backgroundColor: '#f0f8f1' }, icon: { height: 44, width: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5f5e9' }, copy: { flex: 1 }, itemTitle: { color: colors.textDark, fontWeight: '700', fontSize: 14 }, body: { color: '#535e56', fontSize: 13, lineHeight: 18, marginTop: 3 }, date: { color: '#89918b', fontSize: 11, marginTop: 6 }, dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.action }, emptyContainer: { flexGrow: 1, justifyContent: 'center' }, empty: { alignItems: 'center', padding: 30 }, emptyIcon: { width: 58, height: 58, borderRadius: 29, borderWidth: 1.5, borderColor: colors.action, alignItems: 'center', justifyContent: 'center', marginBottom: 15 }, emptyTitle: { color: colors.textDark, fontSize: 18, fontWeight: '800' },
});
