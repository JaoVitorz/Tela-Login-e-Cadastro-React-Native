import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Href, router, useFocusEffect } from "expo-router";
import {
  CalendarDays,
  Clock3,
  MapPin,
  Plus,
  RefreshCcw,
  Search,
  UserRound,
  UsersRound,
} from "lucide-react-native";
import { authApi } from "@/services/api";
import { eventsApi, getEventsErrorMessage } from "@/services/eventsApi";
import { colors } from "@/theme/colors";
import type { EventStatus, EventType, PetEvent } from "@/types/events";

type CategoryFilter = "all" | EventType;
type DateFilter = "all" | "today" | "week" | "month";

const categoryOptions: Array<{ value: CategoryFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "adoption_fair", label: "Adoção" },
  { value: "vaccination_campaign", label: "Vacinação" },
  { value: "awareness", label: "Conscientização" },
  { value: "workshop", label: "Workshop" },
];

const dateOptions: Array<{ value: DateFilter; label: string }> = [
  { value: "all", label: "Todas as datas" },
  { value: "today", label: "Hoje" },
  { value: "week", label: "7 dias" },
  { value: "month", label: "30 dias" },
];

const categoryLabels: Record<EventType, string> = {
  adoption_fair: "Feira de adoção",
  vaccination_campaign: "Vacinação",
  awareness: "Conscientização",
  workshop: "Workshop",
  other: "Outros",
};

const statusLabels: Record<EventStatus, string> = {
  upcoming: "Em breve",
  ongoing: "Acontecendo",
  completed: "Encerrado",
  cancelled: "Cancelado",
};

function SkeletonList() {
  const opacity = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);
  return (
    <View style={styles.skeletonList}>
      {[1, 2, 3].map((item) => (
        <Animated.View key={item} style={[styles.skeletonCard, { opacity }]}>
          <View style={styles.skeletonImage} />
          <View style={styles.skeletonBody}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonLine} />
            <View style={styles.skeletonLineShort} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

function isWithinDate(date: string, filter: DateFilter) {
  if (filter === "all") return true;
  const now = new Date();
  const eventDate = new Date(date);
  const end = new Date(now);
  end.setDate(
    now.getDate() + (filter === "today" ? 1 : filter === "week" ? 7 : 30),
  );
  return (
    eventDate >= new Date(now.getFullYear(), now.getMonth(), now.getDate()) &&
    eventDate <= end
  );
}

function EventCard({
  event,
  userId,
  busy,
  onOpen,
  onToggleRegistration,
}: {
  event: PetEvent;
  userId: string | null;
  busy: boolean;
  onOpen: (event: PetEvent) => void;
  onToggleRegistration: (event: PetEvent, registered: boolean) => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  const registered =
    !!userId &&
    event.participants?.some(
      (participant) => String(participant.userId) === String(userId),
    );
  const full =
    !!event.maxParticipants &&
    event.currentParticipants >= event.maxParticipants;
  const location =
    event.location?.address?.toLowerCase() === "online"
      ? "Evento online"
      : [event.location?.address, event.location?.city, event.location?.state]
          .filter(Boolean)
          .join(", ");

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ver detalhes de ${event.title}`}
        onPress={() => onOpen(event)}
      >
        {event.imageUrl && !imageFailed ? (
          <Image
            source={{ uri: event.imageUrl }}
            style={styles.banner}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View style={styles.bannerFallback}>
            <CalendarDays size={42} color={colors.white} />
            <Text style={styles.bannerFallbackText}>PetJoyful</Text>
          </View>
        )}
        <View style={styles.cardBody}>
          <View style={styles.badgeRow}>
            <View style={styles.badgeGroup}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>
                  {categoryLabels[event.eventType]}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  event.status === "cancelled" && styles.statusCancelled,
                ]}
              >
                <Text style={styles.statusText}>
                  {statusLabels[event.status]}
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.cardTitle}>{event.title}</Text>
          <View style={styles.meta}>
            <CalendarDays size={16} color={colors.action} />
            <Text style={styles.metaText}>
              {start.toLocaleDateString("pt-BR")} ·{" "}
              {start.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              –
              {end.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
          <View style={styles.meta}>
            <MapPin size={16} color={colors.action} />
            <Text style={styles.metaText}>{location}</Text>
          </View>
          <View style={styles.meta}>
            <UserRound size={16} color={colors.action} />
            <Text style={styles.metaText}>
              Organizador: {event.organizerName || "Comunidade PetJoyful"}
            </Text>
          </View>
          <Text style={styles.description} numberOfLines={3}>
            {event.description}
          </Text>
        </View>
      </Pressable>
      <View style={styles.cardActions}>
        <View style={styles.cardFooter}>
          <View style={styles.participants}>
            <UsersRound size={17} color={colors.textMuted} />
            <Text style={styles.participantsText}>
              {event.currentParticipants || 0}
              {event.maxParticipants ? `/${event.maxParticipants}` : ""}{" "}
              participantes
            </Text>
          </View>
          <Pressable
            disabled={
              busy || event.status === "cancelled" || (!registered && full)
            }
            onPress={() => onToggleRegistration(event, registered)}
            style={[
              styles.joinButton,
              registered && styles.joinedButton,
              (busy || (!registered && full)) && styles.disabledButton,
            ]}
          >
            {busy ? (
              <ActivityIndicator
                size="small"
                color={registered ? colors.white : colors.action}
              />
            ) : (
              <Text style={[styles.joinText, registered && styles.joinedText]}>
                {registered ? "Inscrito" : full ? "Lotado" : "Participar"}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function IntegratedEventsScreen() {
  const [events, setEvents] = useState<PetEvent[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [busyEventId, setBusyEventId] = useState<string | null>(null);

  const loadData = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const [eventsResult, profileResult] = await Promise.allSettled([
        eventsApi.list({ limit: 100 }),
        authApi.getProfile(),
      ]);
      if (eventsResult.status === "rejected") throw eventsResult.reason;
      setEvents(eventsResult.value.data);
      if (profileResult.status === "fulfilled") {
        const profileUser = profileResult.value.user;
        setUserId(profileUser.id || profileUser._id || null);
      }
    } catch (loadError) {
      setError(getEventsErrorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return events.filter((event) => {
      const haystack = [
        event.title,
        event.description,
        event.location?.city,
        event.location?.address,
        event.organizerName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (
        (!normalizedQuery || haystack.includes(normalizedQuery)) &&
        (category === "all" || event.eventType === category) &&
        isWithinDate(event.startDate, dateFilter)
      );
    });
  }, [events, query, category, dateFilter]);

  async function toggleRegistration(event: PetEvent, registered: boolean) {
    setBusyEventId(event._id);
    try {
      if (registered) await eventsApi.unregister(event._id);
      else await eventsApi.register(event._id);
      await loadData(true);
      Alert.alert(
        registered ? "Inscrição cancelada" : "Inscrição confirmada",
        registered
          ? "Você não está mais inscrito neste evento."
          : "Nos vemos no evento!",
      );
    } catch (registrationError) {
      Alert.alert(
        "Não foi possível concluir",
        getEventsErrorMessage(registrationError),
      );
    } finally {
      setBusyEventId(null);
    }
  }

  return (
    <View style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            tintColor={colors.action}
          />
        }
      >
        <View style={styles.hero}>
          <View>
            <Text style={styles.heroEyebrow}>PET JOYFUL</Text>
            <Text style={styles.heroTitle}>Eventos e campanhas</Text>
            <Text style={styles.heroText}>
              Encontre iniciativas para cuidar, adotar e transformar.
            </Text>
          </View>
          <CalendarDays size={48} color={colors.accent} />
        </View>
        <View style={styles.searchBox}>
          <Search size={20} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar evento, cidade ou local"
            placeholderTextColor={colors.placeholder}
            style={styles.searchInput}
          />
        </View>
        <Text style={styles.filterLabel}>Categoria</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {categoryOptions.map((item) => (
            <Pressable
              key={item.value}
              onPress={() => setCategory(item.value)}
              style={[
                styles.filter,
                category === item.value && styles.filterActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  category === item.value && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={styles.filterLabel}>Data</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {dateOptions.map((item) => (
            <Pressable
              key={item.value}
              onPress={() => setDateFilter(item.value)}
              style={[
                styles.filter,
                dateFilter === item.value && styles.filterActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  dateFilter === item.value && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {loading ? (
          <SkeletonList />
        ) : error ? (
          <View style={styles.stateCard}>
            <RefreshCcw size={38} color={colors.error} />
            <Text style={styles.stateTitle}>Não foi possível carregar</Text>
            <Text style={styles.stateText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={() => loadData()}>
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : filteredEvents.length === 0 ? (
          <View style={styles.stateCard}>
            <CalendarDays size={42} color={colors.action} />
            <Text style={styles.stateTitle}>Nenhum evento encontrado</Text>
            <Text style={styles.stateText}>
              Experimente outros filtros ou cadastre o primeiro evento.
            </Text>
            <Pressable
              style={styles.retryButton}
              onPress={() => router.push("/event-new" as Href)}
            >
              <Text style={styles.retryText}>Criar evento</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.eventsList}>
            {filteredEvents.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                userId={userId}
                busy={busyEventId === event._id}
                onOpen={(selected) =>
                  router.push({
                    pathname: "/event-details",
                    params: { id: selected._id },
                  } as unknown as Href)
                }
                onToggleRegistration={toggleRegistration}
              />
            ))}
          </View>
        )}
      </ScrollView>
      <Pressable
        accessibilityLabel="Criar novo evento"
        style={styles.fab}
        onPress={() => router.push("/event-new" as Href)}
      >
        <Plus size={27} color={colors.white} />
        <Text style={styles.fabText}>Novo evento</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f7faf7" },
  content: { padding: 16, paddingBottom: 100, gap: 12 },
  hero: {
    backgroundColor: colors.brandPanel,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroEyebrow: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontSize: 23,
    color: colors.white,
    fontWeight: "800",
    marginTop: 5,
  },
  heroText: {
    fontSize: 13,
    color: colors.whiteSoft,
    marginTop: 6,
    maxWidth: 260,
    lineHeight: 18,
  },
  searchBox: {
    height: 48,
    backgroundColor: colors.white,
    borderRadius: 13,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#e0e8e1",
  },
  searchInput: { flex: 1, color: colors.textDark, fontSize: 14 },
  filterLabel: {
    fontSize: 13,
    color: colors.textLabel,
    fontWeight: "800",
    marginTop: 3,
  },
  filters: { gap: 8, paddingRight: 8 },
  filter: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#d6e1d8",
  },
  filterActive: { backgroundColor: colors.action, borderColor: colors.action },
  filterText: { fontSize: 12, color: colors.loginMuted, fontWeight: "700" },
  filterTextActive: { color: colors.white },
  eventsList: { gap: 16, marginTop: 6 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 17,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  banner: { width: "100%", height: 150 },
  bannerFallback: {
    height: 130,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  bannerFallbackText: { color: colors.white, fontWeight: "800" },
  cardBody: { padding: 15, gap: 9 },
  cardActions: { paddingHorizontal: 15, paddingBottom: 15 },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  badgeGroup: { flexDirection: "row", gap: 7, flexWrap: "wrap", flex: 1 },
  categoryBadge: {
    backgroundColor: "#e5f7ea",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
  },
  categoryText: { fontSize: 10, color: colors.brandPanel, fontWeight: "800" },
  statusBadge: {
    backgroundColor: "#e9f1ff",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusCancelled: { backgroundColor: "#feecec" },
  statusText: { fontSize: 10, color: colors.loginMuted, fontWeight: "800" },
  cardTitle: { fontSize: 19, color: colors.textDark, fontWeight: "800" },
  meta: { flexDirection: "row", alignItems: "center", gap: 7 },
  metaText: { fontSize: 12, color: colors.loginMuted, flex: 1 },
  description: { fontSize: 13, color: colors.loginMuted, lineHeight: 19 },
  cardFooter: {
    borderTopWidth: 1,
    borderColor: "#edf0ed",
    paddingTop: 12,
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  participants: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1 },
  participantsText: { fontSize: 11, color: colors.textMuted },
  joinButton: {
    minWidth: 90,
    minHeight: 36,
    paddingHorizontal: 13,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.action,
    alignItems: "center",
    justifyContent: "center",
  },
  joinedButton: { backgroundColor: colors.action },
  disabledButton: { opacity: 0.5 },
  joinText: { fontSize: 12, color: colors.action, fontWeight: "800" },
  joinedText: { color: colors.white },
  stateCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    gap: 9,
    marginTop: 12,
  },
  stateTitle: {
    fontSize: 18,
    color: colors.textDark,
    fontWeight: "800",
    textAlign: "center",
  },
  stateText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 19,
  },
  retryButton: {
    backgroundColor: colors.action,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 4,
  },
  retryText: { color: colors.white, fontWeight: "800" },
  fab: {
    position: "absolute",
    right: 18,
    bottom: 18,
    backgroundColor: colors.action,
    borderRadius: 28,
    minHeight: 54,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    elevation: 7,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  fabText: { color: colors.white, fontWeight: "800" },
  skeletonList: { gap: 14, marginTop: 8 },
  skeletonCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: "hidden",
  },
  skeletonImage: { height: 120, backgroundColor: "#dce7de" },
  skeletonBody: { padding: 15, gap: 10 },
  skeletonTitle: {
    height: 20,
    width: "72%",
    borderRadius: 6,
    backgroundColor: "#dce7de",
  },
  skeletonLine: {
    height: 13,
    width: "100%",
    borderRadius: 5,
    backgroundColor: "#e7eee8",
  },
  skeletonLineShort: {
    height: 13,
    width: "58%",
    borderRadius: 5,
    backgroundColor: "#e7eee8",
  },
});
