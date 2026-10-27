import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Bell, MessageCircle } from 'lucide-react-native';
import { startNotifications, useNotifications } from '@/services/notificationStore';
import { colors } from '@/theme/colors';

function Action({ icon: Icon, count, label, onPress }: { icon: typeof Bell; count: number; label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={8} onPress={onPress} style={styles.button}>
    <Icon size={22} color={colors.white} />
    {count > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text></View>}
  </Pressable>;
}

export function HeaderActions() {
  const notifications = useNotifications();
  useEffect(() => { let stop: (() => void) | undefined; void startNotifications().then((cleanup) => { stop = cleanup; }); return () => stop?.(); }, []);
  const unreadNotifications = notifications.filter((item) => !item.read).length;
  const unreadMessages = notifications.filter((item) => !item.read && item.kind === 'message').length;
  return <View style={styles.actions}>
    <Action icon={Bell} count={unreadNotifications} label="Notificações" onPress={() => router.push('/(tabs)/notificacoes' as never)} />
    <Action icon={MessageCircle} count={unreadMessages} label="Mensagens" onPress={() => router.push('/(tabs)/chat' as never)} />
  </View>;
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', alignItems: 'center', marginRight: 4 },
  button: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  badge: { position: 'absolute', top: 1, right: 0, minWidth: 17, height: 17, paddingHorizontal: 3, borderRadius: 9, backgroundColor: '#e5484d', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.brandPanel },
  badgeText: { color: colors.white, fontSize: 9, fontWeight: '800' },
});
