import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { CalendarDays, MapPin, UserRound } from 'lucide-react-native';
import { AccountPage, accountStyles } from '@/components/AccountPage';
import { SessionGuard } from '@/components/SessionGuard';
import { getProfileErrorMessage } from '@/services/profileApi';
import { getCommunityProfile, type CommunityProfileResult } from '@/services/communityProfileApi';
import { colors } from '@/theme/colors';

type ProfileState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'missing' }
  | ({ status: 'ready' } & CommunityProfileResult);

const profileTypes: Record<string, string> = {
  tutor: 'Tutor de pets',
  instituicao: 'Instituição / ONG',
  clinica: 'Clínica veterinária',
};

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId?: string | string[] }>();
  const resolvedId = typeof userId === 'string' ? userId.trim() : '';
  return (
    <SessionGuard>
      <UserProfile userId={resolvedId} key={resolvedId} />
    </SessionGuard>
  );
}

function UserProfile({ userId }: { userId: string }) {
  const [state, setState] = useState<ProfileState>({ status: 'loading' });
  const [retry, setRetry] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!userId) {
        setState({ status: 'error', message: 'O link não informa um perfil válido.' });
        return;
      }
      setState({ status: 'loading' });
      void getCommunityProfile(userId)
        .then((result) => {
          if (active) setState(result ? { status: 'ready', ...result } : { status: 'missing' });
        })
        .catch((error: unknown) => {
          if (active) setState({ status: 'error', message: getProfileErrorMessage(error) });
        });
      return () => {
        active = false;
      };
    }, [userId, retry]),
  );

  return (
    <AccountPage
      title="Perfil da comunidade"
      subtitle="Conheça quem faz parte da comunidade PetJoyful."
    >
      {state.status === 'loading' && (
        <View style={[accountStyles.card, styles.center]}>
          <ActivityIndicator color={colors.action} accessibilityLabel="Carregando perfil" />
          <Text style={accountStyles.text}>Carregando perfil...</Text>
        </View>
      )}
      {state.status === 'error' && (
        <View style={accountStyles.card}>
          <Text style={accountStyles.title}>Não foi possível carregar o perfil</Text>
          <Text accessibilityRole="alert" style={accountStyles.error}>
            {state.message}
          </Text>
          {!!userId && (
            <Pressable
              accessibilityRole="button"
              style={accountStyles.button}
              onPress={() => setRetry((value) => value + 1)}
            >
              <Text style={accountStyles.buttonText}>Tentar novamente</Text>
            </Pressable>
          )}
        </View>
      )}
      {state.status === 'missing' && (
        <View style={[accountStyles.card, styles.center]}>
          <UserRound size={42} color={colors.brandPanel} />
          <Text style={accountStyles.title}>Perfil ainda não disponível</Text>
          <Text style={styles.emptyText}>
            Não encontramos informações de perfil ou publicações deste usuário.
          </Text>
        </View>
      )}
      {state.status === 'ready' && (
        <ProfileDetails profile={state.profile} detailsAvailable={state.detailsAvailable} />
      )}
    </AccountPage>
  );
}

function ProfileDetails({ profile, detailsAvailable }: CommunityProfileResult) {
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);
  const name = profile.nome?.trim() || 'Usuário da comunidade';
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
  const location = [profile.cidade, profile.estado].filter(Boolean).join(', ');
  const createdAt = profile.createdAt ? new Date(profile.createdAt) : null;
  const joined =
    createdAt && !Number.isNaN(createdAt.getTime())
      ? createdAt.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      : null;

  return (
    <>
      <View style={[accountStyles.card, styles.hero]}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
          {!!profile.foto_perfil && profile.foto_perfil !== failedPhoto && (
            <Image
              source={{ uri: profile.foto_perfil }}
              style={styles.photo}
              accessibilityLabel={`Foto de ${name}`}
              onError={() => setFailedPhoto(profile.foto_perfil!)}
            />
          )}
        </View>
        <Text accessibilityRole="header" selectable style={styles.name}>
          {name}
        </Text>
        {!!profile.tipo_usuario && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {profileTypes[profile.tipo_usuario] || 'Membro da comunidade'}
            </Text>
          </View>
        )}
        {!!location && (
          <View style={styles.detail}>
            <MapPin size={18} color={colors.brandPanel} />
            <Text selectable style={styles.detailText}>
              {location}
            </Text>
          </View>
        )}
      </View>
      <View style={accountStyles.card}>
        <Text accessibilityRole="header" style={accountStyles.title}>
          Sobre
        </Text>
        <Text selectable style={accountStyles.text}>
          {profile.bio?.trim() ||
            (detailsAvailable
              ? 'Este usuário ainda não adicionou uma descrição.'
              : 'Este usuário ainda não preencheu as informações do perfil. Por enquanto, apenas o nome está disponível.')}
        </Text>
        {!!joined && (
          <View style={styles.detail}>
            <CalendarDays size={18} color={colors.brandPanel} />
            <Text style={styles.detailText}>Perfil na comunidade desde {joined}</Text>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { ...accountStyles.text, textAlign: 'center' },
  hero: {
    alignItems: 'center',
    paddingVertical: 32,
    borderTopWidth: 5,
    borderTopColor: colors.action,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: { fontSize: 32, fontWeight: '800', color: colors.brandPanel },
  photo: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  name: { fontSize: 26, fontWeight: '800', color: colors.brandPanel, textAlign: 'center' },
  badge: {
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  badgeText: { color: colors.brandPanel, fontWeight: '600' },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { color: colors.loginMuted, fontSize: 14, lineHeight: 22, flexShrink: 1 },
});
