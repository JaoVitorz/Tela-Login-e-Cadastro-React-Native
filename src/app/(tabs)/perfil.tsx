import { useEffect, useState } from "react";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "expo-router";
import { LogOut, UserRound } from "lucide-react-native";
import { authApi } from "@/services/api";
import { tokenStorage } from "@/services/tokenStorage";
import { colors } from "@/theme/colors";

export default function ProfileScreen() {
  const rootNavigation = useNavigation("/");
  const [name, setName] = useState("Sua conta");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    authApi
      .getProfile()
      .then(({ user }) => {
        setName(user.nome);
        setEmail(user.email);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  async function logout() {
    await tokenStorage.removeToken();
    rootNavigation.reset({ index: 0, routes: [{ name: "index" as never }] });
  }
  return (
    <View style={styles.page}>
      {loading ? (
        <ActivityIndicator color={colors.action} />
      ) : (
        <>
          <View style={styles.avatar}>
            <UserRound size={45} color={colors.white} />
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{email}</Text>
          <View style={styles.info}>
            <Text style={styles.infoTitle}>Comunidade PetJoyful</Text>
            <Text style={styles.infoText}>
              Gerencie seu perfil, seus pets e suas publicações pela versão web
              enquanto essas áreas chegam ao app.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.logout}
            onPress={() =>
              Alert.alert("Sair", "Deseja encerrar sua sessão?", [
                { text: "Cancelar", style: "cancel" },
                { text: "Sair", style: "destructive", onPress: logout },
              ])
            }
          >
            <LogOut size={19} color={colors.error} />
            <Text style={styles.logoutText}>Sair da conta</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    alignItems: "center",
    paddingTop: 42,
  },
  avatar: {
    height: 96,
    width: 96,
    borderRadius: 48,
    backgroundColor: colors.brandPanel,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: 23,
    fontWeight: "800",
    color: colors.textDark,
    marginTop: 16,
  },
  email: { color: colors.textMuted, marginTop: 6 },
  info: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 18,
    marginTop: 32,
    width: "100%",
    gap: 8,
  },
  infoTitle: { fontSize: 17, fontWeight: "800", color: colors.textDark },
  infoText: { lineHeight: 21, color: colors.loginMuted },
  logout: {
    marginTop: 24,
    flexDirection: "row",
    gap: 9,
    alignItems: "center",
    padding: 12,
  },
  logoutText: { color: colors.error, fontWeight: "700" },
});
