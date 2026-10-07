import React, { useCallback, useState } from "react";
import { ActivityIndicator, AppState, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation, usePathname } from "expo-router";
import { LogIn } from "lucide-react-native";
import { tokenStorage } from "@/services/tokenStorage";
import { colors } from "@/theme/colors";

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const navigation = useNavigation("/");
  const pathname = usePathname();
  const [sessionActive, setSessionActive] = useState<boolean | null>(null);

  useFocusEffect(useCallback(() => {
    let mounted = true;
    const checkSession = async () => {
      const token = await tokenStorage.getToken();
      if (mounted) setSessionActive(!!token);
    };
    void checkSession();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void checkSession();
    });
    if (Platform.OS === "web") window.addEventListener("storage", checkSession);
    return () => {
      mounted = false;
      subscription.remove();
      if (Platform.OS === "web") window.removeEventListener("storage", checkSession);
    };
  }, [pathname]));

  if (sessionActive === null) {
    return <View style={styles.page}><ActivityIndicator color={colors.action} /></View>;
  }
  if (!sessionActive) {
    return (
      <View style={styles.page}>
        <LogIn size={48} color={colors.brandPanel} />
        <Text accessibilityRole="header" style={styles.title}>Não existe uma sessão</Text>
        <Text style={styles.description}>Você está desconectado. Volte para o login para acessar sua conta.</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar para o login"
          style={styles.button}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: "index" as never }] })}
        >
          <Text style={styles.buttonText}>Voltar para o login</Text>
        </Pressable>
      </View>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: 24, gap: 18 },
  title: { fontSize: 24, fontWeight: "800", color: colors.textDark, textAlign: "center" },
  description: { fontSize: 16, lineHeight: 24, color: colors.loginMuted, textAlign: "center", maxWidth: 380 },
  button: { backgroundColor: colors.action, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 15, marginTop: 8 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: "700" },
});
