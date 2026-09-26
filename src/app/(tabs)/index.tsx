import { authApi } from "@/services/api";
import { colors } from "@/theme/colors";
import { router } from "expo-router";
import {
  Bot,
  CalendarDays,
  ChevronRight,
  Heart,
  MessageCircle,
  PawPrint,
  UsersRound,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const posts = [
  {
    id: "aatan",
    author: "AATAN — Sorocaba",
    title: "Venha conhecer alguns dos nossos peludinhos!",
    text: "Eles estão esperando uma família que possa oferecer muito carinho e cuidado.",
    tag: "Adoção responsável",
    likes: 42,
    comments: 8,
  },
  {
    id: "vacina",
    author: "Dra. Ana Martins",
    title: "Vacinação também é uma demonstração de amor",
    text: "Manter a carteirinha do seu pet em dia é uma das melhores formas de protegê-lo.",
    tag: "Cuidados",
    likes: 27,
    comments: 4,
  },
];

const shortcuts = [
  {
    title: "Chat com IA",
    text: "Tire dúvidas sobre cuidados",
    icon: Bot,
    color: "#2f9e62",
    action: () =>
      Alert.alert(
        "Em breve",
        "O Chat com IA será a próxima funcionalidade do app.",
      ),
  },
  {
    title: "Compatibilidade",
    text: "Encontre seu par perfeito",
    icon: Heart,
    color: "#e86f7d",
    action: () => router.push("/(tabs)/adocoes"),
  },
  {
    title: "Eventos",
    text: "Campanhas perto de você",
    icon: CalendarDays,
    color: "#8a63d2",
    action: () => router.push("./eventos-integrados"),
  },
];

type Post = (typeof posts)[number];

function ShortcutCard({ shortcut }: { shortcut: (typeof shortcuts)[number] }) {
  const Icon = shortcut.icon;

  return (
    <Pressable style={styles.shortcut} onPress={shortcut.action}>
      <View style={[styles.shortcutIcon, { backgroundColor: shortcut.color }]}>
        <Icon size={22} color={colors.white} />
      </View>
      <Text style={styles.shortcutTitle}>{shortcut.title}</Text>
      <Text style={styles.shortcutText}>{shortcut.text}</Text>
      <ChevronRight
        size={18}
        color={shortcut.color}
        style={styles.shortcutArrow}
      />
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

function PostCard({
  post,
  isLiked,
  onToggleLike,
}: {
  post: Post;
  isLiked: boolean;
  onToggleLike: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.postHeader}>
        <View style={styles.postAvatar}>
          <PawPrint color={colors.white} size={18} />
        </View>
        <View>
          <Text style={styles.author}>{post.author}</Text>
          <Text style={styles.date}>Hoje na comunidade</Text>
        </View>
      </View>
      <Text style={styles.cardTitle}>{post.title}</Text>
      <Text style={styles.cardText}>{post.text}</Text>
      <View style={styles.tag}>
        <Text style={styles.tagText}>{post.tag}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.action} onPress={onToggleLike}>
          <Heart
            size={20}
            color={isLiked ? "#df4d62" : colors.loginMuted}
            fill={isLiked ? "#df4d62" : "transparent"}
          />
          <Text style={styles.actionText}>
            {post.likes + (isLiked ? 1 : 0)}
          </Text>
        </Pressable>
        <Pressable
          style={styles.action}
          onPress={() =>
            Alert.alert(
              "Comentários",
              "Comentários serão integrados na próxima etapa.",
            )
          }
        >
          <MessageCircle size={20} color={colors.loginMuted} />
          <Text style={styles.actionText}>{post.comments}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const [name, setName] = useState("Pet Lover");
  const [refreshing, setRefreshing] = useState(false);
  const [liked, setLiked] = useState<string[]>([]);
  async function loadProfile() {
    try {
      const { user } = await authApi.getProfile();
      setName(user.nome.split(" ")[0] || "Pet Lover");
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
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={colors.action}
        />
      }
    >
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>🐾 PET JOYFUL</Text>
          <Text style={styles.heroTitle}>Olá, {name}!</Text>
          <Text style={styles.heroText}>
            Uma comunidade para cuidar, compartilhar e conectar corações e
            patas.
          </Text>
        </View>
        <View style={styles.heroPaw}>
          <PawPrint size={42} color={colors.accent} />
        </View>
      </View>
      <Pressable
        style={styles.createCard}
        onPress={() =>
          Alert.alert(
            "Publicações",
            "A criação de posts será conectada ao serviço de mensagens na próxima etapa.",
          )
        }
      >
        <View style={styles.createAvatar}>
          <PawPrint size={20} color={colors.white} />
        </View>
        <Text style={styles.createText}>
          Compartilhe um momento com a comunidade...
        </Text>
      </Pressable>
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
      <View style={styles.feedHeader}>
        <Text style={styles.sectionTitle}>Feed da comunidade</Text>
        <Text style={styles.seeAll}>Ver tudo</Text>
      </View>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          isLiked={liked.includes(post.id)}
          onToggleLike={() =>
            setLiked((current) =>
              current.includes(post.id)
                ? current.filter((id) => id !== post.id)
                : [...current, post.id],
            )
          }
        />
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f7faf7" },
  content: { padding: 16, gap: 18, paddingBottom: 28 },
  hero: {
    backgroundColor: colors.brandPanel,
    borderRadius: 20,
    padding: 22,
    minHeight: 170,
    overflow: "hidden",
  },
  heroCopy: { gap: 8, width: "78%" },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  heroTitle: { color: colors.white, fontSize: 29, fontWeight: "800" },
  heroText: { color: colors.whiteSoft, lineHeight: 20, fontSize: 14 },
  heroPaw: {
    position: "absolute",
    right: -7,
    bottom: -7,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(69,221,131,.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  createCard: {
    backgroundColor: colors.white,
    borderRadius: 15,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 7,
  },
  createAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.action,
    alignItems: "center",
    justifyContent: "center",
  },
  createText: {
    flex: 1,
    backgroundColor: "#f1f4f1",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.textMuted,
    fontSize: 13,
  },
  sectionTitle: { fontSize: 20, color: colors.textDark, fontWeight: "800" },
  subtitle: { color: colors.textMuted, marginTop: 4, fontSize: 13 },
  shortcuts: { gap: 12, paddingRight: 8 },
  shortcut: {
    backgroundColor: colors.white,
    borderRadius: 15,
    width: 166,
    padding: 14,
    minHeight: 148,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  shortcutIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutTitle: {
    color: colors.textDark,
    fontWeight: "800",
    fontSize: 15,
    marginTop: 12,
  },
  shortcutText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 5,
    lineHeight: 17,
  },
  shortcutArrow: { position: "absolute", right: 12, bottom: 12 },
  community: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#e5f7ea",
    padding: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#c7ead2",
  },
  communityContent: { flex: 1 },
  communityTitle: { color: colors.brandPanel, fontWeight: "800" },
  communityText: {
    color: "#477156",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  feedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  seeAll: { color: colors.action, fontWeight: "700", fontSize: 13 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 11,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 7,
  },
  postHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  postAvatar: {
    width: 39,
    height: 39,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  author: { color: colors.textDark, fontWeight: "800", fontSize: 14 },
  date: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  cardTitle: { color: colors.textDark, fontWeight: "800", fontSize: 17 },
  cardText: { color: colors.loginMuted, lineHeight: 20, fontSize: 14 },
  tag: {
    alignSelf: "flex-start",
    backgroundColor: "#e3f6e9",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: { fontSize: 11, color: colors.brandPanel, fontWeight: "700" },
  actions: {
    borderTopWidth: 1,
    borderColor: "#edf0ed",
    paddingTop: 11,
    flexDirection: "row",
    gap: 22,
  },
  action: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionText: { fontSize: 12, color: colors.loginMuted, fontWeight: "600" },
});
