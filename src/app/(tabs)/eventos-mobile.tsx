import { useMemo, useState } from "react";
import React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPin,
  Search,
  Ticket,
  UsersRound,
} from "lucide-react-native";
import { colors } from "@/theme/colors";

type Category = "Todos" | "Adoção" | "Saúde" | "Comunidade";

const events = [
  {
    id: "feira",
    category: "Adoção",
    day: "14",
    month: "SET",
    title: "Feira de adoção PetJoyful",
    description:
      "Conheça cães e gatos que estão esperando uma família cheia de carinho.",
    date: "Sábado, 14 de setembro",
    time: "10h às 16h",
    place: "Parque Ibirapuera, São Paulo",
    participants: 86,
    color: "#e76f51",
  },
  {
    id: "vacina",
    category: "Saúde",
    day: "22",
    month: "SET",
    title: "Mutirão de vacinação",
    description:
      "Vacinas, orientações veterinárias e atualização da carteirinha do seu pet.",
    date: "Domingo, 22 de setembro",
    time: "9h às 15h",
    place: "Centro Comunitário Vila Mariana",
    participants: 124,
    color: "#3a86c8",
  },
  {
    id: "passeio",
    category: "Comunidade",
    day: "29",
    month: "SET",
    title: "Cãominhada pela adoção responsável",
    description: "Um encontro ao ar livre para tutores, pets e protetores.",
    date: "Domingo, 29 de setembro",
    time: "8h30",
    place: "Parque Villa-Lobos, São Paulo",
    participants: 51,
    color: "#8a63d2",
  },
];

export default function EventsMobileScreen() {
  const [category, setCategory] = useState<Category>("Todos");
  const [query, setQuery] = useState("");
  const [joinedIds, setJoinedIds] = useState<string[]>([]);
  const categories: Category[] = ["Todos", "Adoção", "Saúde", "Comunidade"];
  const filtered = useMemo(
    () =>
      events.filter(
        (event) =>
          (category === "Todos" || event.category === category) &&
          `${event.title} ${event.place}`
            .toLowerCase()
            .includes(query.toLowerCase().trim()),
      ),
    [category, query],
  );

  function toggleParticipation(id: string, title: string) {
    const joined = joinedIds.includes(id);
    setJoinedIds((current) =>
      joined ? current.filter((item) => item !== id) : [...current, id],
    );
    if (!joined)
      Alert.alert("Presença confirmada", `Você participará de “${title}”.`);
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <CalendarDays size={30} color={colors.accent} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>Eventos e campanhas</Text>
          <Text style={styles.heroText}>
            Participe, ajude e faça a diferença na vida de muitos pets.
          </Text>
        </View>
      </View>
      <View style={styles.searchBox}>
        <Search size={20} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por evento ou local"
          placeholderTextColor={colors.placeholder}
          style={styles.searchInput}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {categories.map((item) => (
          <Pressable
            key={item}
            onPress={() => setCategory(item)}
            style={[styles.filter, category === item && styles.filterActive]}
          >
            <Text
              style={[
                styles.filterText,
                category === item && styles.filterTextActive,
              ]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.heading}>Próximos eventos</Text>
          <Text style={styles.subtitle}>
            {filtered.length} eventos para você descobrir
          </Text>
        </View>
        <Ticket size={25} color={colors.action} />
      </View>
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <CalendarDays size={35} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Nenhum evento encontrado</Text>
          <Text style={styles.emptyText}>
            Tente pesquisar por outro termo ou categoria.
          </Text>
        </View>
      ) : (
        filtered.map((event) => {
          const joined = joinedIds.includes(event.id);
          return (
            <View key={event.id} style={styles.card}>
              <View
                style={[styles.dateBlock, { backgroundColor: event.color }]}
              >
                <Text style={styles.day}>{event.day}</Text>
                <Text style={styles.month}>{event.month}</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.badge}>
                  <Text style={[styles.badgeText, { color: event.color }]}>
                    {event.category}
                  </Text>
                </View>
                <Text style={styles.title}>{event.title}</Text>
                <Text style={styles.description}>{event.description}</Text>
                <View style={styles.meta}>
                  <CalendarDays size={15} color={colors.action} />
                  <Text style={styles.metaText}>{event.date}</Text>
                </View>
                <View style={styles.meta}>
                  <Clock3 size={15} color={colors.action} />
                  <Text style={styles.metaText}>{event.time}</Text>
                </View>
                <View style={styles.meta}>
                  <MapPin size={15} color={colors.action} />
                  <Text style={styles.metaText}>{event.place}</Text>
                </View>
                <View style={styles.cardFooter}>
                  <View style={styles.participants}>
                    <UsersRound size={16} color={colors.textMuted} />
                    <Text style={styles.participantsText}>
                      {event.participants + (joined ? 1 : 0)} participantes
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => toggleParticipation(event.id, event.title)}
                    style={[styles.joinButton, joined && styles.joinedButton]}
                  >
                    <Text
                      style={[styles.joinText, joined && styles.joinedText]}
                    >
                      {joined ? "Participando" : "Participar"}
                    </Text>
                    <ChevronRight
                      size={16}
                      color={joined ? colors.white : colors.action}
                    />
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })
      )}
      <View style={styles.tip}>
        <Text style={styles.tipTitle}>Quer divulgar uma campanha?</Text>
        <Text style={styles.tipText}>
          A criação de eventos para ONGs e veterinários será liberada em breve.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f7faf7" },
  content: { padding: 16, gap: 16, paddingBottom: 30 },
  hero: {
    backgroundColor: colors.brandPanel,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  heroIcon: {
    height: 58,
    width: 58,
    borderRadius: 16,
    backgroundColor: "rgba(69,221,131,.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: { flex: 1, gap: 5 },
  heroTitle: { color: colors.white, fontSize: 22, fontWeight: "800" },
  heroText: { color: colors.whiteSoft, fontSize: 13, lineHeight: 19 },
  searchBox: {
    height: 48,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    borderWidth: 1,
    borderColor: "#e1e8e2",
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.textDark },
  filters: { gap: 9, paddingRight: 8 },
  filter: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "#d5e1d7",
    borderRadius: 20,
    backgroundColor: colors.white,
  },
  filterActive: { backgroundColor: colors.action, borderColor: colors.action },
  filterText: { color: colors.loginMuted, fontSize: 13, fontWeight: "700" },
  filterTextActive: { color: colors.white },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 3,
  },
  heading: { fontSize: 20, fontWeight: "800", color: colors.textDark },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 17,
    padding: 14,
    flexDirection: "row",
    gap: 13,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 7,
  },
  dateBlock: {
    width: 55,
    height: 67,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  day: { color: colors.white, fontSize: 25, fontWeight: "800", lineHeight: 28 },
  month: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  cardContent: { flex: 1, gap: 7 },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#f0f5f1",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { fontSize: 10, fontWeight: "800" },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textDark,
    lineHeight: 21,
  },
  description: { fontSize: 13, color: colors.loginMuted, lineHeight: 18 },
  meta: { flexDirection: "row", gap: 6, alignItems: "center" },
  metaText: { fontSize: 12, color: colors.loginMuted, flex: 1 },
  cardFooter: {
    marginTop: 4,
    paddingTop: 11,
    borderTopWidth: 1,
    borderColor: "#edf0ed",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 6,
  },
  participants: { flexDirection: "row", gap: 5, alignItems: "center" },
  participantsText: { fontSize: 11, color: colors.textMuted },
  joinButton: {
    borderWidth: 1,
    borderColor: colors.action,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  joinedButton: { backgroundColor: colors.action },
  joinText: { color: colors.action, fontWeight: "800", fontSize: 12 },
  joinedText: { color: colors.white },
  empty: {
    padding: 34,
    alignItems: "center",
    gap: 9,
    backgroundColor: colors.white,
    borderRadius: 15,
  },
  emptyTitle: { fontWeight: "800", color: colors.textDark },
  emptyText: { fontSize: 12, color: colors.textMuted, textAlign: "center" },
  tip: {
    backgroundColor: "#e5f7ea",
    borderWidth: 1,
    borderColor: "#c7ead2",
    borderRadius: 14,
    padding: 16,
    gap: 5,
  },
  tipTitle: { color: colors.brandPanel, fontWeight: "800" },
  tipText: { color: "#477156", fontSize: 12, lineHeight: 18 },
});
