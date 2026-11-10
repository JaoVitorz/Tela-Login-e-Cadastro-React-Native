import React from 'react';
import { Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AccountPage, accountStyles } from '@/components/AccountPage';
import { ProfileScreen } from '@/components/ProfileScreen';
import { SessionGuard } from '@/components/SessionGuard';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId?: string | string[] }>();
  const id = typeof userId === 'string' ? userId.trim() : '';
  return (
    <SessionGuard>
      {id ? (
        <ProfileScreen key={id} userId={id} />
      ) : (
        <AccountPage title="Perfil" subtitle="Não foi possível abrir este perfil.">
          <Text accessibilityRole="alert" style={accountStyles.error}>
            O link não informa um perfil válido.
          </Text>
        </AccountPage>
      )}
    </SessionGuard>
  );
}
