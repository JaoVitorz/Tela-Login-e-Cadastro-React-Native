import { useEffect, useState } from "react";
import { SessionGuard } from "@/components/SessionGuard";
import React from "react";
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Href, router, useLocalSearchParams } from "expo-router";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {
  ArrowLeft,
  CalendarDays,
  CalendarPlus,
  Clock3,
} from "lucide-react-native";
import { Input } from "@/components/input";
import { eventsApi, getEventsErrorMessage } from "@/services/eventsApi";
import { colors } from "@/theme/colors";
import type { EventType } from "@/types/events";

const eventTypes: Array<{ value: EventType; label: string }> = [
  { value: "adoption_fair", label: "Adoção" },
  { value: "vaccination_campaign", label: "Vacinação" },
  { value: "awareness", label: "Conscientização" },
  { value: "workshop", label: "Workshop" },
  { value: "other", label: "Outro" },
];

type PickerField = "startDate" | "startTime" | "endDate" | "endTime";

function WebDateTimeInput({
  label,
  type,
  value,
  min,
  onChange,
}: {
  label: string;
  type: "date" | "time";
  value: string;
  min?: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.webPickerWrapper}>
      <Text style={styles.label}>{label}</Text>
      {React.createElement("input", {
        type,
        value,
        min,
        onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.value),
        style: {
          width: "100%",
          height: 48,
          boxSizing: "border-box",
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          backgroundColor: colors.white,
          color: colors.textDark,
          fontSize: 15,
          padding: "0 12px",
          fontFamily: "system-ui, sans-serif",
          cursor: "pointer",
        },
      })}
    </View>
  );
}

export default function NewEventScreen() {
  return <SessionGuard><AuthenticatedNewEventScreen /></SessionGuard>;
}

function AuthenticatedNewEventScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const eventId = Array.isArray(id) ? id[0] : id;
  const isEditing = !!eventId;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<EventType>("adoption_fair");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [pickerField, setPickerField] = useState<PickerField | null>(null);
  const [pickerValue, setPickerValue] = useState(new Date());
  const [online, setOnline] = useState(false);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingEvent, setLoadingEvent] = useState(isEditing);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!eventId) return;
    let active = true;
    async function loadEventForEditing() {
      setLoadingEvent(true);
      setSubmitError("");
      try {
        const event = await eventsApi.getById(eventId as string);
        if (!active) return;
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        setTitle(event.title || "");
        setDescription(event.description || "");
        setEventType(event.eventType || "adoption_fair");
        setStartDate(start);
        setStartTime(start);
        setEndDate(end);
        setEndTime(end);
        const isOnline = event.location?.address?.toLowerCase() === "online";
        setOnline(isOnline);
        setAddress(isOnline ? "" : event.location?.address || "");
        setCity(isOnline ? "" : event.location?.city || "");
        setState(isOnline ? "" : event.location?.state || "");
        setZipCode(isOnline ? "" : event.location?.zipCode || "");
        setImageUrl(event.imageUrl || "");
        setMaxParticipants(
          event.maxParticipants ? String(event.maxParticipants) : "",
        );
        setTags(event.tags?.join(", ") || "");
      } catch (error) {
        if (active) setSubmitError(getEventsErrorMessage(error));
      } finally {
        if (active) setLoadingEvent(false);
      }
    }
    void loadEventForEditing();
    return () => {
      active = false;
    };
  }, [eventId]);

  function setPickerResult(field: PickerField, value: Date) {
    if (field === "startDate") setStartDate(value);
    if (field === "startTime") setStartTime(value);
    if (field === "endDate") setEndDate(value);
    if (field === "endTime") setEndTime(value);
  }

  function openPicker(field: PickerField) {
    const current = { startDate, startTime, endDate, endTime }[field];
    const fallback = field === "endDate" && startDate ? startDate : new Date();
    setPickerValue(current || fallback);
    setPickerField(field);
  }

  function handlePickerChange(event: DateTimePickerEvent, value?: Date) {
    if (Platform.OS === "android") {
      const field = pickerField;
      setPickerField(null);
      if (event.type === "set" && value && field) setPickerResult(field, value);
      return;
    }
    if (value) setPickerValue(value);
  }

  function confirmIosPicker() {
    if (pickerField) setPickerResult(pickerField, pickerValue);
    setPickerField(null);
  }

  function combineDateAndTime(date: Date | null, time: Date | null) {
    if (!date || !time) return null;
    const result = new Date(date);
    result.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return result;
  }

  function formatDate(value: Date | null) {
    return value ? value.toLocaleDateString("pt-BR") : "Selecionar data";
  }

  function formatTime(value: Date | null) {
    return value
      ? value.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Selecionar hora";
  }

  function formatWebDate(value: Date | null) {
    if (!value) return "";
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatWebTime(value: Date | null) {
    if (!value) return "";
    return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
  }

  function setWebDate(field: "startDate" | "endDate", value: string) {
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return;
    setPickerResult(field, new Date(year, month - 1, day));
  }

  function setWebTime(field: "startTime" | "endTime", value: string) {
    const [hours, minutes] = value.split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return;
    const selected = new Date();
    selected.setHours(hours, minutes, 0, 0);
    setPickerResult(field, selected);
  }

  async function handleSubmit() {
    setSubmitError("");
    const start = combineDateAndTime(startDate, startTime);
    const end = combineDateAndTime(endDate, endTime);
    if (!title.trim() || !description.trim() || !start || !end) {
      return Alert.alert(
        "Campos obrigatórios",
        "Preencha título, descrição, datas e horários.",
      );
    }
    if (end <= start)
      return Alert.alert(
        "Período inválido",
        "O término deve acontecer depois do início.",
      );
    if (
      !online &&
      (!address.trim() || !city.trim() || !state.trim() || !zipCode.trim())
    ) {
      return Alert.alert(
        "Localização obrigatória",
        "Preencha o endereço completo ou marque o evento como online.",
      );
    }
    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        eventType,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        location: online
          ? {
              address: "Online",
              city: "Online",
              state: "Web",
              zipCode: "00000-000",
            }
          : {
              address: address.trim(),
              city: city.trim(),
              state: state.trim().toUpperCase(),
              zipCode: zipCode.trim(),
            },
        ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}),
        ...(Number(maxParticipants) > 0
          ? { maxParticipants: Number(maxParticipants) }
          : {}),
        ...(tags.trim()
          ? {
              tags: tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
            }
          : {}),
      };
      if (eventId) await eventsApi.update(eventId, payload);
      else await eventsApi.create(payload);
      if (Platform.OS === "web") {
        window.alert(
          isEditing
            ? "Evento atualizado com sucesso!"
            : "Evento criado com sucesso!",
        );
        if (eventId)
          router.replace({
            pathname: "/event-details",
            params: { id: eventId },
          } as unknown as Href);
        else router.back();
      } else {
        Alert.alert(
          isEditing ? "Evento atualizado" : "Evento criado",
          isEditing
            ? "As alterações foram salvas."
            : "Seu evento já está disponível para a comunidade.",
          [
            {
              text: "Continuar",
              onPress: () =>
                eventId
                  ? router.replace({
                      pathname: "/event-details",
                      params: { id: eventId },
                    } as unknown as Href)
                  : router.back(),
            },
          ],
        );
      }
    } catch (error) {
      const message = getEventsErrorMessage(error);
      setSubmitError(message);
      Alert.alert(
        isEditing ? "Erro ao editar evento" : "Erro ao criar evento",
        message,
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingEvent) {
    return (
      <View style={styles.loadingPage}>
        <ActivityIndicator size="large" color={colors.action} />
        <Text style={styles.loadingText}>Carregando dados do evento...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Voltar"
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft color={colors.white} size={24} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>
            {isEditing ? "Editar evento" : "Novo evento"}
          </Text>
          <Text style={styles.headerText}>
            {isEditing
              ? "Atualize as informações da iniciativa"
              : "Compartilhe uma iniciativa com a comunidade"}
          </Text>
        </View>
        <CalendarPlus color={colors.accent} size={30} />
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Informações principais</Text>
        <Input
          label="Título *"
          value={title}
          onChangeText={setTitle}
          placeholder="Ex.: Feira de adoção PetJoyful"
          maxLength={100}
        />
        <Input
          label="Descrição *"
          value={description}
          onChangeText={setDescription}
          placeholder="Conte os detalhes do evento"
          multiline
          numberOfLines={5}
          style={styles.textArea}
          maxLength={2000}
        />
        <Text style={styles.label}>Categoria *</Text>
        <View style={styles.typeGrid}>
          {eventTypes.map((item) => (
            <Pressable
              key={item.value}
              onPress={() => setEventType(item.value)}
              style={[
                styles.typeButton,
                eventType === item.value && styles.typeButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.typeText,
                  eventType === item.value && styles.typeTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Data e horário</Text>
        {Platform.OS === "web" ? (
          <>
            <View style={styles.row}>
              <View style={styles.flex}>
                <WebDateTimeInput
                  label="Data inicial *"
                  type="date"
                  value={formatWebDate(startDate)}
                  min={formatWebDate(new Date())}
                  onChange={(value) => setWebDate("startDate", value)}
                />
              </View>
              <View style={styles.timeField}>
                <WebDateTimeInput
                  label="Hora *"
                  type="time"
                  value={formatWebTime(startTime)}
                  onChange={(value) => setWebTime("startTime", value)}
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.flex}>
                <WebDateTimeInput
                  label="Data final *"
                  type="date"
                  value={formatWebDate(endDate)}
                  min={formatWebDate(startDate || new Date())}
                  onChange={(value) => setWebDate("endDate", value)}
                />
              </View>
              <View style={styles.timeField}>
                <WebDateTimeInput
                  label="Hora *"
                  type="time"
                  value={formatWebTime(endTime)}
                  onChange={(value) => setWebTime("endTime", value)}
                />
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.label}>Data inicial *</Text>
                <Pressable
                  accessibilityRole="button"
                  style={styles.pickerButton}
                  onPress={() => openPicker("startDate")}
                >
                  <CalendarDays size={19} color={colors.action} />
                  <Text
                    style={[
                      styles.pickerText,
                      !startDate && styles.pickerPlaceholder,
                    ]}
                  >
                    {formatDate(startDate)}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.timeField}>
                <Text style={styles.label}>Hora *</Text>
                <Pressable
                  accessibilityRole="button"
                  style={styles.pickerButton}
                  onPress={() => openPicker("startTime")}
                >
                  <Clock3 size={19} color={colors.action} />
                  <Text
                    style={[
                      styles.pickerText,
                      !startTime && styles.pickerPlaceholder,
                    ]}
                  >
                    {formatTime(startTime)}
                  </Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.label}>Data final *</Text>
                <Pressable
                  accessibilityRole="button"
                  style={styles.pickerButton}
                  onPress={() => openPicker("endDate")}
                >
                  <CalendarDays size={19} color={colors.action} />
                  <Text
                    style={[
                      styles.pickerText,
                      !endDate && styles.pickerPlaceholder,
                    ]}
                  >
                    {formatDate(endDate)}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.timeField}>
                <Text style={styles.label}>Hora *</Text>
                <Pressable
                  accessibilityRole="button"
                  style={styles.pickerButton}
                  onPress={() => openPicker("endTime")}
                >
                  <Clock3 size={19} color={colors.action} />
                  <Text
                    style={[
                      styles.pickerText,
                      !endTime && styles.pickerPlaceholder,
                    ]}
                  >
                    {formatTime(endTime)}
                  </Text>
                </Pressable>
              </View>
            </View>
          </>
        )}

        <View style={styles.onlineRow}>
          <View style={styles.flex}>
            <Text style={styles.onlineTitle}>Evento online</Text>
            <Text style={styles.onlineText}>
              Não será necessário informar endereço físico.
            </Text>
          </View>
          <Switch
            value={online}
            onValueChange={setOnline}
            trackColor={{ true: colors.action }}
          />
        </View>
        {!online && (
          <>
            <Text style={styles.sectionTitle}>Localização</Text>
            <Input
              label="Endereço *"
              value={address}
              onChangeText={setAddress}
              placeholder="Rua, número e complemento"
            />
            <View style={styles.row}>
              <View style={styles.flex}>
                <Input
                  label="Cidade *"
                  value={city}
                  onChangeText={setCity}
                  placeholder="São Paulo"
                />
              </View>
              <View style={styles.stateField}>
                <Input
                  label="UF *"
                  value={state}
                  onChangeText={setState}
                  placeholder="SP"
                  autoCapitalize="characters"
                  maxLength={2}
                />
              </View>
            </View>
            <Input
              label="CEP *"
              value={zipCode}
              onChangeText={setZipCode}
              placeholder="00000-000"
              keyboardType="numbers-and-punctuation"
            />
          </>
        )}

        <Text style={styles.sectionTitle}>Detalhes opcionais</Text>
        <Input
          label="URL da imagem/banner"
          value={imageUrl}
          onChangeText={setImageUrl}
          placeholder="https://..."
          keyboardType="url"
          autoCapitalize="none"
        />
        <Input
          label="Limite de participantes"
          value={maxParticipants}
          onChangeText={setMaxParticipants}
          placeholder="Sem limite"
          keyboardType="number-pad"
        />
        <Input
          label="Tags"
          value={tags}
          onChangeText={setTags}
          placeholder="adoção, cães, gratuito"
        />

        {!!submitError && (
          <View style={styles.submitError}>
            <Text style={styles.submitErrorText}>{submitError}</Text>
          </View>
        )}
        <Pressable
          disabled={submitting}
          onPress={handleSubmit}
          style={[styles.submit, submitting && styles.submitDisabled]}
        >
          <Text style={styles.submitText}>
            {submitting
              ? isEditing
                ? "Salvando alterações..."
                : "Publicando evento..."
              : isEditing
                ? "Salvar alterações"
                : "Publicar evento"}
          </Text>
        </Pressable>
        {!isEditing && (
          <Text style={styles.helper}>
            Por enquanto, a criação está liberada para todos os usuários
            autenticados.
          </Text>
        )}
      </ScrollView>

      {Platform.OS === "android" && pickerField && (
        <DateTimePicker
          value={pickerValue}
          mode={pickerField.endsWith("Date") ? "date" : "time"}
          display="default"
          minimumDate={pickerField.endsWith("Date") ? new Date() : undefined}
          is24Hour
          onChange={handlePickerChange}
        />
      )}

      {Platform.OS === "ios" && (
        <Modal
          transparent
          animationType="slide"
          visible={!!pickerField}
          onRequestClose={() => setPickerField(null)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setPickerField(null)}
          >
            <Pressable
              style={styles.pickerModal}
              onPress={(event) => event.stopPropagation()}
            >
              <Text style={styles.pickerModalTitle}>
                {pickerField?.endsWith("Date")
                  ? "Escolha a data"
                  : "Escolha o horário"}
              </Text>
              <DateTimePicker
                value={pickerValue}
                mode={pickerField?.endsWith("Date") ? "date" : "time"}
                display="spinner"
                minimumDate={
                  pickerField?.endsWith("Date") ? new Date() : undefined
                }
                is24Hour
                locale="pt-BR"
                onChange={handlePickerChange}
              />
              <View style={styles.modalActions}>
                <Pressable
                  style={styles.cancelPicker}
                  onPress={() => setPickerField(null)}
                >
                  <Text style={styles.cancelPickerText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={styles.confirmPicker}
                  onPress={confirmIosPicker}
                >
                  <Text style={styles.confirmPickerText}>Confirmar</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f7faf7" },
  loadingPage: {
    flex: 1,
    backgroundColor: "#f7faf7",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { color: colors.textMuted, fontSize: 14 },
  header: {
    backgroundColor: colors.brandPanel,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: { flex: 1 },
  headerTitle: { color: colors.white, fontSize: 22, fontWeight: "800" },
  headerText: { color: colors.whiteSoft, fontSize: 12, marginTop: 3 },
  content: { padding: 18, gap: 15, paddingBottom: 36 },
  sectionTitle: {
    fontSize: 17,
    color: colors.textDark,
    fontWeight: "800",
    marginTop: 5,
  },
  label: {
    color: colors.textLabel,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 7,
  },
  webPickerWrapper: { width: "100%" },
  textArea: { height: 112, textAlignVertical: "top", paddingTop: 13 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeButton: {
    borderWidth: 1,
    borderColor: "#d5e1d7",
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  typeButtonActive: {
    backgroundColor: colors.action,
    borderColor: colors.action,
  },
  typeText: { fontSize: 12, color: colors.loginMuted, fontWeight: "700" },
  typeTextActive: { color: colors.white },
  row: { flexDirection: "row", gap: 10 },
  flex: { flex: 1 },
  timeField: { width: 145 },
  stateField: { width: 82 },
  pickerButton: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pickerText: { fontSize: 14, color: colors.textDark, flex: 1 },
  pickerPlaceholder: { color: colors.placeholder },
  onlineRow: {
    backgroundColor: "#e5f7ea",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  onlineTitle: { color: colors.brandPanel, fontWeight: "800" },
  onlineText: { color: "#477156", fontSize: 11, marginTop: 3 },
  submitError: {
    borderWidth: 1,
    borderColor: colors.errorBorder,
    backgroundColor: colors.errorBackground,
    borderRadius: 10,
    padding: 12,
  },
  submitErrorText: { color: colors.errorText, fontSize: 13, lineHeight: 18 },
  submit: {
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.action,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: colors.white, fontSize: 16, fontWeight: "800" },
  helper: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.45)",
    justifyContent: "flex-end",
  },
  pickerModal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 30,
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textDark,
    textAlign: "center",
    marginBottom: 8,
  },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  cancelPicker: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelPickerText: { color: colors.loginMuted, fontWeight: "800" },
  confirmPicker: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: colors.action,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmPickerText: { color: colors.white, fontWeight: "800" },
});
