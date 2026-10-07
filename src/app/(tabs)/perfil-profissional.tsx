import { useCallback, useMemo, useState } from "react";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Href, router, useFocusEffect, useNavigation } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  CheckCircle2,
  LogOut,
  Mail,
  Menu,
  MapPin,
  Pencil,
  Phone,
  RefreshCcw,
  Share2,
  Trash2,
  UserRound,
  X,
} from "lucide-react-native";
import { Input } from "@/components/input";
import { authApi, extractApiErrorMessage } from "@/services/api";
import { eventsApi } from "@/services/eventsApi";
import { getProfileErrorMessage, profileApi } from "@/services/profileApi";
import {
  getStoredProfileCover,
  persistProfileCover,
  removeStoredProfileCover,
} from "@/services/profileCoverStore";
import {
  getStoredProfilePhoto,
  persistProfilePhoto,
  setProfilePhoto,
} from "@/services/profilePhotoStore";
import { tokenStorage } from "@/services/tokenStorage";
import { colors } from "@/theme/colors";
import type { PetEvent } from "@/types/events";
import type {
  ProfessionalProfile,
  ProfessionalProfileUpdate,
} from "@/types/profile";

type ProfileTab = "posts" | "about" | "events";

interface ProfileView extends ProfessionalProfile {
  email: string;
  authType?: string;
  userId: string;
}

interface EditDraft {
  nome: string;
  email: string;
  bio: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  numero: string;
  complemento: string;
  dataNascimento: string;
}

const emptyDraft: EditDraft = {
  nome: "",
  email: "",
  bio: "",
  telefone: "",
  endereco: "",
  cidade: "",
  estado: "",
  cep: "",
  numero: "",
  complemento: "",
  dataNascimento: "",
};

function roleLabel(type?: string) {
  const labels: Record<string, string> = {
    tutor: "Tutor de pets",
    adotante: "Tutor e adotante",
    cliente: "Membro da comunidade",
    instituicao: "Instituição / ONG",
    ong: "Instituição / ONG",
    clinica: "Clínica veterinária",
    veterinario: "Profissional veterinário",
    admin: "Administrador",
  };
  return labels[type || ""] || "Membro PetJoyful";
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "PJ"
  );
}

function EventPreview({ event }: { event: PetEvent }) {
  const start = new Date(event.startDate);
  return (
    <Pressable
      style={styles.eventCard}
      onPress={() =>
        router.push({
          pathname: "/event-details",
          params: { id: event._id },
        } as unknown as Href)
      }
    >
      {event.imageUrl ? (
        <Image source={{ uri: event.imageUrl }} style={styles.eventImage} />
      ) : (
        <View style={styles.eventImageFallback}>
          <CalendarDays color={colors.white} size={28} />
        </View>
      )}
      <View style={styles.eventContent}>
        <Text style={styles.eventDate}>
          {start
            .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
            .toUpperCase()}
        </Text>
        <Text style={styles.eventTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.eventMeta} numberOfLines={1}>
          {event.location?.address?.toLowerCase() === "online"
            ? "Online"
            : [event.location?.city, event.location?.state]
                .filter(Boolean)
                .join(" · ")}
        </Text>
      </View>
    </Pressable>
  );
}

export default function ProfessionalProfileScreen() {
  const rootNavigation = useNavigation("/");
  const [profile, setProfile] = useState<ProfileView | null>(null);
  const [createdEvents, setCreatedEvents] = useState<PetEvent[]>([]);
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<EditDraft>(emptyDraft);
  const [imageFailed, setImageFailed] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFailed, setCoverFailed] = useState(false);
  const [savingCover, setSavingCover] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [confirmingDeletion, setConfirmingDeletion] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deletionError, setDeletionError] = useState("");

  const loadProfile = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const { user } = await authApi.getProfile();
      const userId = user.id || user._id || "";
      const [professionalResult, eventsResult, storedPhotoResult, coverResult] =
        await Promise.allSettled([
          profileApi.getMyProfile(),
          eventsApi.list({ limit: 100 }),
          getStoredProfilePhoto(userId),
          getStoredProfileCover(userId),
        ]);
      const professional =
        professionalResult.status === "fulfilled"
          ? professionalResult.value
          : null;
      const storedPhoto =
        storedPhotoResult.status === "fulfilled"
          ? storedPhotoResult.value
          : null;
      const resolvedPhoto =
        professional?.foto_perfil || storedPhoto || undefined;
      setImageFailed(false);
      setAvatarPreview(null);
      setCoverFailed(false);
      setCoverPreview(null);
      setCoverUri(coverResult.status === "fulfilled" ? coverResult.value : null);
      setProfilePhoto(resolvedPhoto || null);
      if (professional?.foto_perfil)
        void persistProfilePhoto(userId, professional.foto_perfil);
      setProfile({
        ...(professional || {}),
        userId,
        nome: professional?.nome || user.nome || "Sua conta",
        email: professional?.email || user.email || "",
        foto_perfil: resolvedPhoto,
        authType: user.tipo,
      });
      if (eventsResult.status === "fulfilled") {
        setCreatedEvents(
          eventsResult.value.data.filter(
            (event) => String(event.organizer) === String(userId),
          ),
        );
      }
    } catch (loadError) {
      setError(extractApiErrorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const participantReach = useMemo(
    () =>
      createdEvents.reduce(
        (total, event) => total + (event.currentParticipants || 0),
        0,
      ),
    [createdEvents],
  );

  function openEditor() {
    if (!profile) return;
    setDraft({
      nome: profile.nome || "",
      email: profile.email || "",
      bio: profile.bio || "",
      telefone: profile.telefone || "",
      endereco: profile.endereco || "",
      cidade: profile.cidade || "",
      estado: profile.estado || "",
      cep: profile.cep || "",
      numero: profile.numero || "",
      complemento: profile.complemento || "",
      dataNascimento: profile.data_nascimento
        ? profile.data_nascimento.slice(0, 10)
        : "",
    });
    setEditing(true);
  }

  async function saveProfile() {
    if (!draft.nome.trim() || !draft.email.trim()) {
      Alert.alert("Campos obrigatórios", "Informe seu nome e e-mail.");
      return;
    }
    if (draft.estado.trim() && draft.estado.trim().length !== 2) {
      Alert.alert(
        "UF inválida",
        "O estado deve conter exatamente duas letras.",
      );
      return;
    }
    if (draft.cep.trim() && !/^\d{5}-?\d{3}$/.test(draft.cep.trim())) {
      Alert.alert("CEP inválido", "Use o formato 00000-000 ou 00000000.");
      return;
    }
    setSaving(true);
    try {
      await authApi.updateProfile({
        nome: draft.nome.trim(),
        email: draft.email.trim().toLowerCase(),
      });
      try {
        const professionalData: ProfessionalProfileUpdate = {
          nome: draft.nome.trim(),
          ...(draft.bio.trim() ? { bio: draft.bio.trim() } : {}),
          ...(draft.telefone.trim() ? { telefone: draft.telefone.trim() } : {}),
          ...(draft.endereco.trim() ? { endereco: draft.endereco.trim() } : {}),
          ...(draft.numero.trim() ? { numero: draft.numero.trim() } : {}),
          ...(draft.complemento.trim()
            ? { complemento: draft.complemento.trim() }
            : {}),
          ...(draft.cidade.trim() ? { cidade: draft.cidade.trim() } : {}),
          ...(draft.estado.trim()
            ? { estado: draft.estado.trim().toUpperCase() }
            : {}),
          ...(draft.cep.trim() ? { cep: draft.cep.trim() } : {}),
          ...(draft.dataNascimento.trim()
            ? { data_nascimento: draft.dataNascimento.trim() }
            : {}),
        };
        await profileApi.updateMyProfile(professionalData);
      } catch (professionalError) {
        Alert.alert(
          "Dados básicos salvos",
          `Nome e e-mail foram atualizados, mas os dados profissionais não puderam ser salvos: ${getProfileErrorMessage(professionalError)}`,
        );
        setEditing(false);
        await loadProfile(true);
        return;
      }
      setEditing(false);
      await loadProfile(true);
      Alert.alert(
        "Perfil atualizado",
        "Suas informações profissionais foram salvas.",
      );
    } catch (saveError) {
      Alert.alert("Não foi possível salvar", extractApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await tokenStorage.removeToken();
    setProfilePhoto(null);
    rootNavigation.reset({ index: 0, routes: [{ name: "index" as never }] });
  }
  async function deleteAccount() {
    if (deletingAccount) return;
    setDeletingAccount(true);
    setDeletionError("");
    try {
      await authApi.deleteProfile();
      await tokenStorage.removeToken();
      setProfilePhoto(null);
      rootNavigation.reset({ index: 0, routes: [{ name: "index" as never }] });
    } catch (deleteError) {
      setDeletionError(extractApiErrorMessage(deleteError));
    } finally {
      setDeletingAccount(false);
    }
  }
  function confirmLogout() {
    if (Platform.OS === "web") {
      if (window.confirm("Deseja encerrar sua sessão?")) void logout();
      return;
    }
    Alert.alert("Sair", "Deseja encerrar sua sessão?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: logout },
    ]);
  }
  async function shareProfile() {
    if (profile)
      await Share.share({
        message: `Conheça ${profile.nome} na comunidade PetJoyful.`,
      });
  }

  async function selectAndUploadPhoto() {
    if (uploadingPhoto) return;
    const previousPhoto = profile?.foto_perfil || null;
    if (Platform.OS !== "web") {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permissão necessária",
          "Autorize o acesso às fotos para escolher uma imagem de perfil.",
        );
        return;
      }
    }
    const selection = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (selection.canceled) return;
    const asset = selection.assets[0];
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      Alert.alert(
        "Imagem muito grande",
        "Escolha uma imagem com no máximo 5 MB.",
      );
      return;
    }
    setImageFailed(false);
    setAvatarPreview(asset.uri);
    setProfilePhoto(asset.uri);
    setUploadingPhoto(true);
    try {
      const photoUrl = await profileApi.uploadProfilePhoto({
        uri: asset.uri,
        name: asset.fileName || `perfil-${Date.now()}.jpg`,
        type: asset.mimeType || "image/jpeg",
        file: asset.file || undefined,
      });
      const versionedPhotoUrl = `${photoUrl}${photoUrl.includes("?") ? "&" : "?"}v=${Date.now()}`;
      await persistProfilePhoto(profile?.userId || "", photoUrl);
      setImageFailed(false);
      setProfilePhoto(versionedPhotoUrl);
      setProfile((current) =>
        current ? { ...current, foto_perfil: versionedPhotoUrl } : current,
      );
      Alert.alert("Foto atualizada", "Sua nova foto de perfil foi salva.");
    } catch (photoError) {
      setAvatarPreview(null);
      setProfilePhoto(previousPhoto);
      Alert.alert(
        "Não foi possível enviar a foto",
        getProfileErrorMessage(photoError),
      );
    } finally {
      setUploadingPhoto(false);
    }
  }

  function showCoverError(message: string) {
    if (Platform.OS === "web") window.alert(message);
    else Alert.alert("Não foi possível alterar a capa", message);
  }

  async function selectCoverPhoto() {
    if (savingCover || !profile?.userId) return;
    try {
      if (Platform.OS !== "web") {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          showCoverError("Autorize o acesso às fotos para escolher uma capa.");
          return;
        }
      }
      const selection = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [16, 7],
        quality: 0.7,
      });
      if (selection.canceled) return;
      const asset = selection.assets[0];
      const type = asset.mimeType || "image/jpeg";
      const allowedTypes =
        Platform.OS === "web"
          ? ["image/jpeg", "image/png", "image/webp"]
          : ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
      if (!allowedTypes.includes(type)) {
        showCoverError("Escolha uma imagem JPG, PNG ou WebP.");
        return;
      }
      const maxSize = Platform.OS === "web" ? 2 : 5;
      if (asset.fileSize && asset.fileSize > maxSize * 1024 * 1024) {
        showCoverError(`Escolha uma imagem com no máximo ${maxSize} MB.`);
        return;
      }

      setCoverFailed(false);
      setCoverPreview(asset.uri);
      setSavingCover(true);
      const savedUri = await persistProfileCover(profile.userId, {
        uri: asset.uri,
        type,
        file: asset.file || undefined,
      });
      setCoverFailed(false);
      setCoverUri(savedUri);
      setCoverPreview(null);
    } catch (coverError) {
      setCoverPreview(null);
      showCoverError(
        coverError instanceof Error
          ? coverError.message
          : "Não foi possível salvar a imagem escolhida.",
      );
    } finally {
      setSavingCover(false);
    }
  }

  async function removeCoverPhoto() {
    if (savingCover || !profile?.userId) return;
    setSavingCover(true);
    try {
      await removeStoredProfileCover(profile.userId);
      setCoverUri(null);
      setCoverPreview(null);
      setCoverFailed(false);
    } catch (coverError) {
      showCoverError(
        coverError instanceof Error
          ? coverError.message
          : "Não foi possível remover a capa.",
      );
    } finally {
      setSavingCover(false);
    }
  }

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.action} />
        <Text style={styles.loadingText}>Carregando seu perfil...</Text>
      </View>
    );
  if (error || !profile)
    return (
      <View style={styles.center}>
        <RefreshCcw size={42} color={colors.error} />
        <Text style={styles.errorTitle}>
          Não foi possível carregar o perfil
        </Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={() => loadProfile()}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );

  const location = [profile.cidade, profile.estado].filter(Boolean).join(", ");
  const type = roleLabel(profile.tipo_usuario || profile.authType);
  const recentEvents = createdEvents.slice(0, 3);
  const avatarUri = avatarPreview || profile.foto_perfil;
  const coverImageUri = coverPreview || coverUri;
  const hasCoverImage = !!coverImageUri && !coverFailed;

  return (
    <View style={styles.page}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadProfile(true)}
            tintColor={colors.action}
          />
        }
      >
        <View style={styles.topBar}>
          <Text style={styles.brand}>PetJoyful</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir menu da conta"
            style={styles.iconButton}
            onPress={() => setAccountMenuOpen(true)}
          >
            <Menu size={22} color={colors.textDark} />
          </Pressable>
        </View>
        <View style={styles.cover}>
          {hasCoverImage ? (
            <>
              <Image
                key={coverImageUri}
                source={{ uri: coverImageUri! }}
                style={styles.coverImage}
                resizeMode="cover"
                onError={() => setCoverFailed(true)}
              />
              <View style={styles.coverShade} />
            </>
          ) : (
            <>
              <View style={styles.coverCircleLarge} />
              <View style={styles.coverCircleSmall} />
              <Text style={styles.coverBrand}>PET JOYFUL</Text>
              <Text style={styles.coverSubtitle}>
                Conectando pessoas que cuidam
              </Text>
            </>
          )}
          {hasCoverImage && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remover foto de capa"
              disabled={savingCover}
              onPress={() => void removeCoverPhoto()}
              style={styles.removeCoverButton}
            >
              <X size={16} color={colors.white} />
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              hasCoverImage ? "Alterar foto de capa" : "Adicionar foto de capa"
            }
            disabled={savingCover}
            onPress={() => void selectCoverPhoto()}
            style={styles.coverEditButton}
          >
            {savingCover ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Camera size={16} color={colors.white} />
            )}
            <Text style={styles.coverEditText}>
              {hasCoverImage ? "Alterar capa" : "Adicionar capa"}
            </Text>
          </Pressable>
        </View>
        <View style={styles.identity}>
          <View style={styles.avatarFrame}>
            {avatarUri && !imageFailed ? (
              <Image
                key={avatarUri}
                source={{ uri: avatarUri }}
                style={styles.avatarImage}
                onError={() => setImageFailed(true)}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>
                  {initials(profile.nome)}
                </Text>
              </View>
            )}
            <Pressable
              accessibilityLabel="Alterar foto do perfil"
              disabled={uploadingPhoto}
              style={styles.cameraBadge}
              onPress={selectAndUploadPhoto}
            >
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Camera size={15} color={colors.white} />
              )}
            </Pressable>
          </View>
          <Text style={styles.name}>{profile.nome}</Text>
          <View style={styles.roleRow}>
            <BriefcaseBusiness size={15} color={colors.action} />
            <Text style={styles.role}>{type}</Text>
            {profile.tipo_usuario && (
              <CheckCircle2 size={15} color={colors.action} />
            )}
          </View>
          {!!profile.bio && (
            <Text style={styles.bio} numberOfLines={3}>
              {profile.bio}
            </Text>
          )}
          <View style={styles.profileActions}>
            <Pressable style={styles.editButton} onPress={openEditor}>
              <Pencil size={17} color={colors.white} />
              <Text style={styles.editText}>Editar perfil</Text>
            </Pressable>
            <Pressable style={styles.shareButton} onPress={shareProfile}>
              <Share2 size={18} color={colors.textDark} />
              <Text style={styles.shareText}>Compartilhar</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{createdEvents.length}</Text>
            <Text style={styles.statLabel}>Eventos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{participantReach}</Text>
            <Text style={styles.statLabel}>Participantes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>
              {profile.tipo_usuario ? "✓" : "—"}
            </Text>
            <Text style={styles.statLabel}>Perfil profissional</Text>
          </View>
        </View>
        <View style={styles.tabs}>
          {(
            [
              ["posts", "Publicações"],
              ["about", "Sobre"],
              ["events", "Eventos"],
            ] as Array<[ProfileTab, string]>
          ).map(([value, label]) => (
            <Pressable
              key={value}
              style={[styles.tab, activeTab === value && styles.tabActive]}
              onPress={() => setActiveTab(value)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === value && styles.tabTextActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeTab === "posts" && (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Apresentação</Text>
              <Text style={styles.cardText}>
                {profile.bio ||
                  "Conte para a comunidade sobre você, seu trabalho e sua relação com os animais."}
              </Text>
              {!!location && (
                <View style={styles.detailRow}>
                  <MapPin size={19} color={colors.textMuted} />
                  <Text style={styles.detailText}>
                    Mora em <Text style={styles.detailStrong}>{location}</Text>
                  </Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Mail size={19} color={colors.textMuted} />
                <Text style={styles.detailText}>{profile.email}</Text>
              </View>
              <View style={styles.detailRow}>
                <BriefcaseBusiness size={19} color={colors.textMuted} />
                <Text style={styles.detailText}>{type}</Text>
              </View>
              <Pressable
                style={styles.secondaryFullButton}
                onPress={openEditor}
              >
                <Text style={styles.secondaryFullText}>Editar detalhes</Text>
              </Pressable>
            </View>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>Atividade recente</Text>
                  <Text style={styles.cardSubtitle}>
                    Eventos publicados por você
                  </Text>
                </View>
              </View>
              {recentEvents.length ? (
                recentEvents.map((event) => (
                  <EventPreview key={event._id} event={event} />
                ))
              ) : (
                <View style={styles.empty}>
                  <CalendarDays size={34} color={colors.action} />
                  <Text style={styles.emptyTitle}>
                    Nenhuma publicação ainda
                  </Text>
                  <Text style={styles.emptyText}>
                    Seus eventos aparecerão aqui como atividade do perfil.
                  </Text>
                  <Pressable
                    style={styles.createButton}
                    onPress={() => router.push("/event-new" as Href)}
                  >
                    <Text style={styles.createText}>Criar evento</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        )}

        {activeTab === "about" && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Sobre</Text>
              <Pressable onPress={openEditor}>
                <Pencil size={19} color={colors.action} />
              </Pressable>
            </View>
            <Text style={styles.aboutSection}>Informações profissionais</Text>
            <View style={styles.detailRow}>
              <UserRound size={20} color={colors.action} />
              <View style={styles.detailCopy}>
                <Text style={styles.detailLabel}>Nome</Text>
                <Text style={styles.detailValue}>{profile.nome}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <BriefcaseBusiness size={20} color={colors.action} />
              <View style={styles.detailCopy}>
                <Text style={styles.detailLabel}>Categoria</Text>
                <Text style={styles.detailValue}>{type}</Text>
              </View>
            </View>
            <Text style={styles.aboutSection}>Contato e localização</Text>
            <View style={styles.detailRow}>
              <Mail size={20} color={colors.action} />
              <View style={styles.detailCopy}>
                <Text style={styles.detailLabel}>E-mail</Text>
                <Text style={styles.detailValue}>{profile.email}</Text>
              </View>
            </View>
            {!!profile.telefone && (
              <View style={styles.detailRow}>
                <Phone size={20} color={colors.action} />
                <View style={styles.detailCopy}>
                  <Text style={styles.detailLabel}>Telefone</Text>
                  <Text style={styles.detailValue}>{profile.telefone}</Text>
                </View>
              </View>
            )}
            {!!(profile.endereco || location) && (
              <View style={styles.detailRow}>
                <MapPin size={20} color={colors.action} />
                <View style={styles.detailCopy}>
                  <Text style={styles.detailLabel}>Endereço</Text>
                  <Text style={styles.detailValue}>
                    {[
                      [profile.endereco, profile.numero]
                        .filter(Boolean)
                        .join(", "),
                      profile.complemento,
                      location,
                      profile.cep,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </View>
              </View>
            )}
            {!!profile.data_nascimento && (
              <View style={styles.detailRow}>
                <CalendarDays size={20} color={colors.action} />
                <View style={styles.detailCopy}>
                  <Text style={styles.detailLabel}>Data de nascimento</Text>
                  <Text style={styles.detailValue}>
                    {new Date(profile.data_nascimento).toLocaleDateString(
                      "pt-BR",
                      { timeZone: "UTC" },
                    )}
                  </Text>
                </View>
              </View>
            )}
            {!!profile.createdAt && (
              <View style={styles.detailRow}>
                <CalendarDays size={20} color={colors.action} />
                <View style={styles.detailCopy}>
                  <Text style={styles.detailLabel}>Na comunidade desde</Text>
                  <Text style={styles.detailValue}>
                    {new Date(profile.createdAt).toLocaleDateString("pt-BR", {
                      month: "long",
                      year: "numeric",
                    })}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {activeTab === "events" && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>Meus eventos</Text>
                <Text style={styles.cardSubtitle}>
                  {createdEvents.length} publicados
                </Text>
              </View>
              <Pressable
                style={styles.smallCreateButton}
                onPress={() => router.push("/event-new" as Href)}
              >
                <Text style={styles.smallCreateText}>+ Novo</Text>
              </Pressable>
            </View>
            {createdEvents.length ? (
              createdEvents.map((event) => (
                <EventPreview key={event._id} event={event} />
              ))
            ) : (
              <View style={styles.empty}>
                <CalendarDays size={38} color={colors.action} />
                <Text style={styles.emptyTitle}>
                  Você ainda não criou eventos
                </Text>
                <Text style={styles.emptyText}>
                  Publique sua primeira iniciativa para a comunidade.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={accountMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAccountMenuOpen(false)}
      >
        <Pressable style={styles.accountMenuBackdrop} onPress={() => setAccountMenuOpen(false)}>
          <Pressable style={styles.accountMenu} onPress={(event) => event.stopPropagation()}>
            <Pressable
              accessibilityRole="button"
              style={styles.accountMenuItem}
              onPress={() => {
                setAccountMenuOpen(false);
                confirmLogout();
              }}
            >
              <LogOut size={20} color={colors.textDark} />
              <Text style={styles.accountMenuText}>Sair da conta</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={styles.accountMenuItem}
              onPress={() => {
                setAccountMenuOpen(false);
                setDeletionError("");
                setConfirmingDeletion(true);
              }}
            >
              <Trash2 size={20} color={colors.error} />
              <Text style={styles.deleteAccountText}>Excluir conta permanentemente</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={confirmingDeletion}
        transparent
        animationType="fade"
        onRequestClose={() => { if (!deletingAccount) setConfirmingDeletion(false); }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Excluir conta permanentemente?</Text>
            <Text style={styles.deletionDescription}>
              Sua conta será excluída permanentemente. Esta ação não pode ser desfeita.
            </Text>
            {!!deletionError && <Text accessibilityRole="alert" style={styles.deleteAccountText}>{deletionError}</Text>}
            <View style={styles.modalActions}>
              <Pressable accessibilityRole="button" disabled={deletingAccount} style={styles.accountMenuItem} onPress={() => setConfirmingDeletion(false)}>
                <Text style={styles.accountMenuText}>Cancelar</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={deletingAccount} style={styles.accountMenuItem} onPress={() => void deleteAccount()}>
                {deletingAccount && <ActivityIndicator size="small" color={colors.error} />}
                <Text style={styles.deleteAccountText}>{deletingAccount ? "Excluindo…" : "Excluir permanentemente"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={editing}
        transparent
        animationType="slide"
        onRequestClose={() => setEditing(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Editar perfil</Text>
                <Text style={styles.modalSubtitle}>
                  Atualize sua apresentação profissional
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Fechar"
                style={styles.closeButton}
                onPress={() => setEditing(false)}
              >
                <X size={22} color={colors.textDark} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.form}
              keyboardShouldPersistTaps="handled"
            >
              <Input
                label="Nome *"
                value={draft.nome}
                onChangeText={(nome) =>
                  setDraft((current) => ({ ...current, nome }))
                }
                placeholder="Seu nome ou organização"
              />
              <Input
                label="E-mail *"
                value={draft.email}
                onChangeText={(email) =>
                  setDraft((current) => ({ ...current, email }))
                }
                placeholder="contato@exemplo.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Input
                label="Biografia"
                value={draft.bio}
                onChangeText={(bio) =>
                  setDraft((current) => ({ ...current, bio }))
                }
                placeholder="Conte sobre seu trabalho com animais"
                multiline
                numberOfLines={4}
                style={styles.bioInput}
                maxLength={500}
              />
              <Input
                label="Telefone"
                value={draft.telefone}
                onChangeText={(telefone) =>
                  setDraft((current) => ({ ...current, telefone }))
                }
                placeholder="(00) 00000-0000"
                keyboardType="phone-pad"
              />
              <Input
                label="Data de nascimento"
                value={draft.dataNascimento}
                onChangeText={(dataNascimento) =>
                  setDraft((current) => ({ ...current, dataNascimento }))
                }
                placeholder="AAAA-MM-DD"
                keyboardType="numbers-and-punctuation"
                maxLength={10}
              />
              <Input
                label="Endereço"
                value={draft.endereco}
                onChangeText={(endereco) =>
                  setDraft((current) => ({ ...current, endereco }))
                }
                placeholder="Rua ou avenida"
              />
              <View style={styles.formRow}>
                <View style={styles.numberField}>
                  <Input
                    label="Número"
                    value={draft.numero}
                    onChangeText={(numero) =>
                      setDraft((current) => ({ ...current, numero }))
                    }
                    placeholder="123"
                  />
                </View>
                <View style={styles.formFlex}>
                  <Input
                    label="Complemento"
                    value={draft.complemento}
                    onChangeText={(complemento) =>
                      setDraft((current) => ({ ...current, complemento }))
                    }
                    placeholder="Apto, bloco..."
                  />
                </View>
              </View>
              <View style={styles.formRow}>
                <View style={styles.formFlex}>
                  <Input
                    label="Cidade"
                    value={draft.cidade}
                    onChangeText={(cidade) =>
                      setDraft((current) => ({ ...current, cidade }))
                    }
                    placeholder="Sua cidade"
                  />
                </View>
                <View style={styles.ufField}>
                  <Input
                    label="UF"
                    value={draft.estado}
                    onChangeText={(estado) =>
                      setDraft((current) => ({ ...current, estado }))
                    }
                    placeholder="SP"
                    maxLength={2}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
              <Input
                label="CEP"
                value={draft.cep}
                onChangeText={(cep) =>
                  setDraft((current) => ({ ...current, cep }))
                }
                placeholder="00000-000"
                keyboardType="numbers-and-punctuation"
              />
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable
                disabled={saving}
                style={styles.cancelButton}
                onPress={() => setEditing(false)}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                disabled={saving}
                style={[styles.saveButton, saving && styles.disabled]}
                onPress={saveProfile}
              >
                {saving ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.saveText}>Salvar alterações</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  accountMenuBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,.25)", alignItems: "flex-end", padding: 16, paddingTop: 58 },
  accountMenu: { backgroundColor: colors.white, borderRadius: 14, padding: 8, maxWidth: "100%", elevation: 6 },
  accountMenuItem: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, minHeight: 44, flexShrink: 1 },
  accountMenuText: { color: colors.textDark, fontWeight: "600" },
  deleteAccountText: { color: colors.error, fontWeight: "700", flexShrink: 1 },
  deletionDescription: { color: colors.textMuted, lineHeight: 22, marginVertical: 16 },
  page: { flex: 1, backgroundColor: "#eef1f4" },
  content: { paddingBottom: 32 },
  topBar: {
    height: 54,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e7e9ec",
  },
  brand: { fontSize: 23, fontWeight: "900", color: colors.brandPanel },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#edf0f2",
    alignItems: "center",
    justifyContent: "center",
  },
  cover: {
    height: 172,
    backgroundColor: colors.brandPanel,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  coverImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  coverShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,.12)",
  },
  coverEditButton: {
    position: "absolute",
    right: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,.62)",
    paddingHorizontal: 10,
    minHeight: 32,
  },
  coverEditText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  removeCoverButton: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,.62)",
    alignItems: "center",
    justifyContent: "center",
  },
  coverCircleLarge: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(69,221,131,.12)",
    right: -50,
    top: -100,
  },
  coverCircleSmall: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,255,255,.07)",
    left: -30,
    bottom: -55,
  },
  coverBrand: {
    color: colors.white,
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: 2,
  },
  coverSubtitle: { color: colors.whiteSoft, fontSize: 12, marginTop: 6 },
  identity: {
    backgroundColor: colors.white,
    alignItems: "center",
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  avatarFrame: {
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: colors.white,
    padding: 5,
    marginTop: -58,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 8,
  },
  avatarImage: { width: "100%", height: "100%", borderRadius: 58 },
  avatarFallback: {
    flex: 1,
    borderRadius: 58,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { fontSize: 38, color: colors.white, fontWeight: "900" },
  cameraBadge: {
    position: "absolute",
    right: 3,
    bottom: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.action,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.white,
  },
  name: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.textDark,
    marginTop: 10,
    textAlign: "center",
  },
  roleRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 },
  role: { fontSize: 13, color: colors.loginMuted, fontWeight: "700" },
  bio: {
    fontSize: 13,
    color: colors.loginMuted,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 10,
    maxWidth: 340,
  },
  profileActions: {
    flexDirection: "row",
    gap: 9,
    width: "100%",
    marginTop: 16,
  },
  editButton: {
    flex: 1,
    height: 43,
    borderRadius: 9,
    backgroundColor: colors.action,
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  editText: { color: colors.white, fontWeight: "800", fontSize: 13 },
  shareButton: {
    flex: 1,
    height: 43,
    borderRadius: 9,
    backgroundColor: "#e8ebee",
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  shareText: { color: colors.textDark, fontWeight: "800", fontSize: 13 },
  stats: {
    backgroundColor: colors.white,
    marginTop: 8,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  stat: { flex: 1, alignItems: "center", paddingHorizontal: 4 },
  statNumber: { fontSize: 19, fontWeight: "900", color: colors.textDark },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "700",
    marginTop: 3,
    textAlign: "center",
  },
  statDivider: { height: 34, width: 1, backgroundColor: "#e1e4e7" },
  tabs: {
    backgroundColor: colors.white,
    marginTop: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e3e6",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: colors.action },
  tabText: { fontSize: 12, color: colors.textMuted, fontWeight: "800" },
  tabTextActive: { color: colors.action },
  tabContent: { gap: 9 },
  card: { backgroundColor: colors.white, marginTop: 9, padding: 16, gap: 13 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitle: { fontSize: 19, color: colors.textDark, fontWeight: "900" },
  cardSubtitle: { fontSize: 11, color: colors.textMuted, marginTop: 3 },
  cardText: { fontSize: 14, color: colors.loginMuted, lineHeight: 21 },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  detailText: {
    fontSize: 13,
    color: colors.loginMuted,
    flex: 1,
    lineHeight: 19,
  },
  detailStrong: { fontWeight: "800", color: colors.textDark },
  detailCopy: { flex: 1 },
  detailLabel: { fontSize: 11, color: colors.textMuted, fontWeight: "700" },
  detailValue: {
    fontSize: 14,
    color: colors.textDark,
    marginTop: 2,
    lineHeight: 20,
  },
  secondaryFullButton: {
    height: 40,
    borderRadius: 8,
    backgroundColor: "#e8ebee",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  secondaryFullText: {
    color: colors.textDark,
    fontWeight: "800",
    fontSize: 13,
  },
  eventCard: {
    borderWidth: 1,
    borderColor: "#e1e5e2",
    borderRadius: 12,
    overflow: "hidden",
    flexDirection: "row",
    minHeight: 92,
    backgroundColor: "#fbfcfb",
  },
  eventImage: { width: 104, height: "100%", minHeight: 92 },
  eventImageFallback: {
    width: 104,
    minHeight: 92,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  eventContent: { flex: 1, padding: 11, justifyContent: "center" },
  eventDate: { fontSize: 10, color: colors.action, fontWeight: "900" },
  eventTitle: {
    fontSize: 14,
    color: colors.textDark,
    fontWeight: "800",
    lineHeight: 18,
    marginTop: 3,
  },
  eventMeta: { fontSize: 11, color: colors.textMuted, marginTop: 5 },
  empty: { alignItems: "center", paddingVertical: 20, gap: 7 },
  emptyTitle: {
    fontSize: 15,
    color: colors.textDark,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  createButton: {
    backgroundColor: colors.action,
    borderRadius: 18,
    paddingHorizontal: 17,
    paddingVertical: 9,
    marginTop: 4,
  },
  createText: { color: colors.white, fontWeight: "800", fontSize: 12 },
  smallCreateButton: {
    backgroundColor: "#e5f7ea",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  smallCreateText: { color: colors.action, fontSize: 12, fontWeight: "900" },
  aboutSection: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 5,
    paddingBottom: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#edf0ed",
  },
  center: {
    flex: 1,
    backgroundColor: "#eef1f4",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    gap: 10,
  },
  loadingText: { color: colors.textMuted, fontSize: 13 },
  errorTitle: {
    fontSize: 18,
    color: colors.textDark,
    fontWeight: "900",
    textAlign: "center",
  },
  errorText: { fontSize: 13, color: colors.textMuted, textAlign: "center" },
  retryButton: {
    backgroundColor: colors.action,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 4,
  },
  retryText: { color: colors.white, fontWeight: "800" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.48)",
    justifyContent: "flex-end",
  },
  modalCard: {
    height: "92%",
    backgroundColor: "#f7faf7",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
  },
  modalHeader: {
    backgroundColor: colors.white,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e4e7e5",
  },
  modalTitle: { fontSize: 21, color: colors.textDark, fontWeight: "900" },
  modalSubtitle: { fontSize: 11, color: colors.textMuted, marginTop: 3 },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#edf0f2",
    alignItems: "center",
    justifyContent: "center",
  },
  form: { padding: 18, gap: 15, paddingBottom: 28 },
  bioInput: { height: 96, textAlignVertical: "top", paddingTop: 12 },
  formRow: { flexDirection: "row", gap: 10 },
  formFlex: { flex: 1 },
  numberField: { width: 100 },
  ufField: { width: 80 },
  modalActions: {
    backgroundColor: colors.white,
    padding: 14,
    flexDirection: "row",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#e4e7e5",
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#e8ebee",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { color: colors.textDark, fontWeight: "800" },
  saveButton: {
    flex: 1.5,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.action,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: colors.white, fontWeight: "900" },
  disabled: { opacity: 0.6 },
});
