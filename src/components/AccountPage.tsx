import React, { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '@/theme/colors';

export function AccountPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <View style={accountStyles.page}>
      <View style={accountStyles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={accountStyles.back}
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/(tabs)/perfil-profissional')
          }
        >
          <ArrowLeft color={colors.white} />
        </Pressable>
        <Text accessibilityRole="header" style={accountStyles.headerTitle}>
          {title}
        </Text>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={accountStyles.content}>
        <Text style={accountStyles.subtitle}>{subtitle}</Text>
        {children}
      </ScrollView>
    </View>
  );
}

export const accountStyles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.tabsBackground },
  header: {
    padding: 16,
    paddingTop: 24,
    backgroundColor: colors.brandPanel,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  back: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: colors.white, fontSize: 21, fontWeight: '700', flex: 1 },
  content: {
    padding: 20,
    gap: 16,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingBottom: 48,
  },
  subtitle: { color: colors.loginMuted, fontSize: 15, lineHeight: 23 },
  card: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.brandPanel, fontSize: 19, fontWeight: '700' },
  text: { color: colors.textDark, fontSize: 15, lineHeight: 24 },
  button: {
    backgroundColor: colors.brandPanel,
    minHeight: 48,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  secondary: {
    padding: 14,
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: colors.brandPanel, fontWeight: '700' },
  error: {
    color: colors.errorText,
    backgroundColor: colors.errorBackground,
    padding: 14,
    borderRadius: 10,
    lineHeight: 22,
  },
  success: {
    color: colors.brandPanel,
    backgroundColor: colors.background,
    padding: 14,
    borderRadius: 10,
    lineHeight: 22,
  },
});
