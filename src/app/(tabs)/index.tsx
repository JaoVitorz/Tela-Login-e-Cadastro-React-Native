import { authApi } from '@/services/api';
import { HomeFeed } from '@/components/HomeFeed';
import { colors } from '@/theme/colors';
import { router } from 'expo-router';
import { Bot, CalendarDays, ChevronRight, Heart, PawPrint, UsersRound } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

const shortcuts = [
  {
    title: 'Chat com IA',
    text: 'Tire dúvidas sobre cuidados',
    icon: Bot,
    color: '#2f9e62',
    action: () => Alert.alert('Em breve', 'O Chat com IA será a próxima funcionalidade do app.'),
  },
  {
    title: 'Compatibilidade',
    text: 'Encontre seu par perfeito',
    icon: Heart,
    color: '#e86f7d',
    action: () => router.push('/(tabs)/adocoes'),
  },
  {
    title: 'Eventos',
    text: 'Campanhas perto de você',
    icon: CalendarDays,
    color: '#8a63d2',
    action: () => router.push('./eventos-integrados'),
  },
];

function ShortcutCard({ shortcut }: { shortcut: (typeof shortcuts)[number] }) {
  const Icon = shortcut.icon;

  return (
    <Pressable style={styles.shortcut} onPress={shortcut.action}>
      <View style={[styles.shortcutIcon, { backgroundColor: shortcut.color }]}>
        <Icon size={22} color={colors.white} />
      </View>
      <Text style={styles.shortcutTitle}>{shortcut.title}</Text>
      <Text style={styles.shortcutText}>{shortcut.text}</Text>
      <ChevronRight size={18} color={shortcut.color} style={styles.shortcutArrow} />
    </Pressable>
  );
}

function CommunityBanner() {
  return (
    <View style={styles.community}>
      <UsersRound size={25} color={colors.brandPanel} />
      <View style={styles.communityContent}>
        <Text style={styles.communityTitle}>Comunidade que transforma</Text>
        <Text style={styles.communityText}>
          Conheça histórias, campanhas e pessoas que fazem a diferença.
        </Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const [name, setName] = useState('Pet Lover');
  const [fullName, setFullName] = useState('Usuário');
  const [userId, setUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  async function loadProfile() {
    try {
      const { user } = await authApi.getProfile();
      setName(user.nome.split(' ')[0] || 'Pet Lover');
      setFullName(user.nome || 'Usuário');
      setUserId(user.id || user._id || null);
    } catch {}
  }
  useEffect(() => {
    loadProfile();
  }, []);
  async function refresh() {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  }
  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.action} />
      }
    >
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>🐾 PET JOYFUL</Text>
          <Text style={styles.heroTitle}>Olá, {name}!</Text>
          <Text style={styles.heroText}>
            Uma comunidade para cuidar, compartilhar e conectar corações e patas.
          </Text>
        </View>
        <View style={styles.heroPaw}>
          <PawPrint size={42} color={colors.accent} />
        </View>
      </View>
      <View>
        <Text style={styles.sectionTitle}>Descubra o PetJoyful</Text>
        <Text style={styles.subtitle}>Ferramentas para você e seu pet</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.shortcuts}
      >
        {shortcuts.map((shortcut) => (
          <ShortcutCard key={shortcut.title} shortcut={shortcut} />
        ))}
      </ScrollView>
      <CommunityBanner />
      <HomeFeed authorName={fullName} userId={userId} />
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f7faf7' },
  content: { padding: 16, gap: 18, paddingBottom: 28 },
  hero: {
    backgroundColor: colors.brandPanel,
    borderRadius: 20,
    padding: 22,
    minHeight: 170,
    overflow: 'hidden',
  },
  heroCopy: { gap: 8, width: '78%' },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroTitle: { color: colors.white, fontSize: 29, fontWeight: '800' },
  heroText: { color: colors.whiteSoft, lineHeight: 20, fontSize: 14 },
  heroPaw: {
    position: 'absolute',
    right: -7,
    bottom: -7,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(69,221,131,.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 20, color: colors.textDark, fontWeight: '800' },
  subtitle: { color: colors.textMuted, marginTop: 4, fontSize: 13 },
  shortcuts: { gap: 12, paddingRight: 8 },
  shortcut: {
    backgroundColor: colors.white,
    borderRadius: 15,
    width: 166,
    padding: 14,
    minHeight: 148,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  shortcutIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutTitle: {
    color: colors.textDark,
    fontWeight: '800',
    fontSize: 15,
    marginTop: 12,
  },
  shortcutText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 5,
    lineHeight: 17,
  },
  shortcutArrow: { position: 'absolute', right: 12, bottom: 12 },
  community: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#e5f7ea',
    padding: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#c7ead2',
  },
  communityContent: { flex: 1 },
  communityTitle: { color: colors.brandPanel, fontWeight: '800' },
  communityText: {
    color: '#477156',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
});
