import { useCallback, useState } from "react";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Href,
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  Pencil,
  RefreshCcw,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react-native";
import { authApi } from "@/services/api";
import { eventsApi, getEventsErrorMessage } from "@/services/eventsApi";
import { colors } from "@/theme/colors";
import type { EventStatus, EventType, PetEvent } from "@/types/events";

const categoryLabels: Record<EventType, string> = {
  adoption_fair: "Feira de adoção",
  vaccination_campaign: "Campanha de vacinação",
  awareness: "Conscientização",
  workshop: "Workshop",
  other: "Outro",
};

const statusLabels: Record<EventStatus, string> = {
  upcoming: "Em breve",
  ongoing: "Em andamento",
  completed: "Finalizado",
  cancelled: "Cancelado",
};

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const eventId = Array.isArray(id) ? id[0] : id;
  const [event, setEvent] = useState<PetEvent | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  const loadEvent = useCallback(
    async (refresh = false) => {
      if (!eventId) {
        setError("Evento não encontrado.");
        setLoading(false);
        return;
      }
      refresh ? setRefreshing(true) : setLoading(true);
      setError("");
      try {
        const [eventResult, profileResult] = await Promise.allSettled([
          eventsApi.getById(eventId),
          authApi.getProfile(),
        ]);
        if (eventResult.status === "rejected") throw eventResult.reason;
        setEvent(eventResult.value);
        setImageFailed(false);
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
    },
    [eventId],
  );

  useFocusEffect(
    useCallback(() => {
      loadEvent();
    }, [loadEvent]),
  );

  async function toggleRegistration() {
    if (!event || !userId) return;
    const registered = event.participants?.some(
      (participant) => String(participant.userId) === String(userId),
    );
    setBusy(true);
    try {
      if (registered) await eventsApi.unregister(event._id);
      else await eventsApi.register(event._id);
      await loadEvent(true);
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
      setBusy(false);
    }
  }

  async function performDelete() {
    if (!event) return;
    setBusy(true);
    try {
      await eventsApi.delete(event._id);
      if (Platform.OS === "web") window.alert("Evento excluído com sucesso.");
      else
        Alert.alert("Evento excluído", "O evento foi removido da comunidade.");
      router.replace("/(tabs)/eventos-integrados" as Href);
    } catch (deleteError) {
      Alert.alert(
        "Não foi possível excluir",
        getEventsErrorMessage(deleteError),
      );
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    if (!event) return;
    if (Platform.OS === "web") {
      if (
        window.confirm(
          `Excluir "${event.title}"? Esta ação não pode ser desfeita.`,
        )
      )
        void performDelete();
      return;
    }
    Alert.alert(
      "Excluir evento",
      `Deseja excluir "${event.title}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: performDelete },
      ],
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.action} />
        <Text style={styles.loadingText}>Carregando evento...</Text>
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.center}>
        <RefreshCcw size={42} color={colors.error} />
        <Text style={styles.errorTitle}>Não foi possível abrir o evento</Text>
        <Text style={styles.errorText}>
          {error || "Evento não encontrado."}
        </Text>
        <Pressable style={styles.primaryButton} onPress={() => loadEvent()}>
          <Text style={styles.primaryButtonText}>Tentar novamente</Text>
        </Pressable>
        <Pressable style={styles.linkButton} onPress={() => router.back()}>
          <Text style={styles.linkText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  const isOwner = !!userId && String(event.organizer) === String(userId);
  const registered =
    !!userId &&
    event.participants?.some(
      (participant) => String(participant.userId) === String(userId),
    );
  const full =
    !!event.maxParticipants &&
    event.currentParticipants >= event.maxParticipants;
  const online = event.location?.address?.toLowerCase() === "online";
  const location = online
    ? "Evento online"
    : [event.location?.address, event.location?.city, event.location?.state]
        .filter(Boolean)
        .join(", ");

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Voltar"
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <ArrowLeft color={colors.white} size={24} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerEyebrow}>DETALHES DO EVENTO</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {event.title}
          </Text>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadEvent(true)}
            tintColor={colors.action}
          />
        }
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
            <CalendarDays size={64} color={colors.white} />
            <Text style={styles.bannerFallbackText}>PetJoyful</Text>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.badges}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {categoryLabels[event.eventType]}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                event.status === "cancelled" && styles.cancelledBadge,
              ]}
            >
              <Text style={styles.statusText}>
                {statusLabels[event.status]}
              </Text>
            </View>
          </View>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.sectionTitle}>Sobre o evento</Text>
          <Text style={styles.description}>{event.description}</Text>
          {!!event.tags?.length && (
            <View style={styles.tags}>
              {event.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Informações</Text>
          <View style={styles.infoRow}>
            <CalendarDays size={21} color={colors.action} />
            <View style={styles.infoCopy}>
              <Text style={styles.infoLabel}>Início</Text>
              <Text style={styles.infoText}>
                {start.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}{" "}
                às{" "}
                {start.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Clock3 size={21} color={colors.action} />
            <View style={styles.infoCopy}>
              <Text style={styles.infoLabel}>Término</Text>
              <Text style={styles.infoText}>
                {end.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}{" "}
                às{" "}
                {end.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <MapPin size={21} color={colors.action} />
            <View style={styles.infoCopy}>
              <Text style={styles.infoLabel}>Localização</Text>
              <Text style={styles.infoText}>
                {location}
                {!online && event.location?.zipCode
                  ? `\nCEP: ${event.location.zipCode}`
                  : ""}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <UserRound size={21} color={colors.action} />
            <View style={styles.infoCopy}>
              <Text style={styles.infoLabel}>Organizador</Text>
              <Text style={styles.infoText}>
                {event.organizerName || "Comunidade PetJoyful"}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <UsersRound size={21} color={colors.action} />
            <View style={styles.infoCopy}>
              <Text style={styles.infoLabel}>Participantes</Text>
              <Text style={styles.infoText}>
                {event.currentParticipants || 0}
                {event.maxParticipants ? ` de ${event.maxParticipants}` : ""}
                {full ? " · Vagas esgotadas" : ""}
              </Text>
            </View>
          </View>
        </View>

        {isOwner ? (
          <View style={styles.ownerActions}>
            <Text style={styles.ownerTitle}>Você criou este evento</Text>
            <Pressable
              disabled={busy}
              style={styles.editButton}
              onPress={() =>
                router.push({
                  pathname: "/event-new",
                  params: { id: event._id },
                } as Href)
              }
            >
              <Pencil size={19} color={colors.white} />
              <Text style={styles.actionText}>Editar evento</Text>
            </Pressable>
            <Pressable
              disabled={busy}
              style={styles.deleteButton}
              onPress={confirmDelete}
            >
              {busy ? (
                <ActivityIndicator color={colors.errorText} />
              ) : (
                <Trash2 size={19} color={colors.errorText} />
              )}
              <Text style={styles.deleteText}>
                {busy ? "Excluindo..." : "Excluir evento"}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            disabled={
              busy || event.status === "cancelled" || (!registered && full)
            }
            style={[
              styles.participateButton,
              registered && styles.registeredButton,
              (busy || (!registered && full)) && styles.disabled,
            ]}
            onPress={toggleRegistration}
          >
            {busy ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.actionText}>
                {registered
                  ? "Cancelar inscrição"
                  : full
                    ? "Vagas esgotadas"
                    : "Participar do evento"}
              </Text>
            )}
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f7faf7" },
  header: {
    backgroundColor: colors.brandPanel,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: { flex: 1 },
  headerEyebrow: {
    fontSize: 10,
    color: colors.accent,
    fontWeight: "800",
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 19,
    color: colors.white,
    fontWeight: "800",
    marginTop: 3,
  },
  content: { padding: 16, paddingBottom: 40, gap: 15 },
  banner: { height: 230, width: "100%", borderRadius: 18 },
  bannerFallback: {
    height: 210,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  bannerFallbackText: { color: colors.white, fontSize: 18, fontWeight: "800" },
  card: {
    backgroundColor: colors.white,
    borderRadius: 17,
    padding: 18,
    gap: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 7,
  },
  badges: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  categoryBadge: {
    backgroundColor: "#e5f7ea",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  categoryText: { fontSize: 11, color: colors.brandPanel, fontWeight: "800" },
  statusBadge: {
    backgroundColor: "#e9f1ff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  cancelledBadge: { backgroundColor: "#feecec" },
  statusText: { fontSize: 11, color: colors.loginMuted, fontWeight: "800" },
  title: {
    fontSize: 26,
    color: colors.textDark,
    fontWeight: "800",
    lineHeight: 32,
  },
  sectionTitle: { fontSize: 17, color: colors.textDark, fontWeight: "800" },
  description: { fontSize: 14, color: colors.loginMuted, lineHeight: 22 },
  tags: { flexDirection: "row", gap: 7, flexWrap: "wrap" },
  tag: {
    backgroundColor: "#f0f5f1",
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  tagText: { fontSize: 11, color: colors.brandPanel, fontWeight: "700" },
  infoRow: {
    flexDirection: "row",
    gap: 11,
    alignItems: "flex-start",
    paddingVertical: 4,
  },
  infoCopy: { flex: 1 },
  infoLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "700",
    marginBottom: 3,
  },
  infoText: { fontSize: 14, color: colors.textDark, lineHeight: 20 },
  ownerActions: {
    backgroundColor: colors.white,
    borderRadius: 17,
    padding: 18,
    gap: 11,
  },
  ownerTitle: {
    fontSize: 14,
    color: colors.brandPanel,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 2,
  },
  editButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.action,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  deleteButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.errorBackground,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  deleteText: { color: colors.errorText, fontWeight: "800" },
  participateButton: {
    height: 52,
    borderRadius: 13,
    backgroundColor: colors.action,
    alignItems: "center",
    justifyContent: "center",
  },
  registeredButton: { backgroundColor: colors.brandPanel },
  disabled: { opacity: 0.5 },
  actionText: { color: colors.white, fontSize: 15, fontWeight: "800" },
  center: {
    flex: 1,
    backgroundColor: "#f7faf7",
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    gap: 11,
  },
  loadingText: { fontSize: 14, color: colors.textMuted },
  errorTitle: {
    fontSize: 19,
    color: colors.textDark,
    fontWeight: "800",
    textAlign: "center",
  },
  errorText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 19,
  },
  primaryButton: {
    backgroundColor: colors.action,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 20,
    marginTop: 6,
  },
  primaryButtonText: { color: colors.white, fontWeight: "800" },
  linkButton: { padding: 8 },
  linkText: { color: colors.action, fontWeight: "800" },
});
