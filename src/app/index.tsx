import {
  View,
  StyleSheet,
  Image,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useState } from "react";
import { Link } from "expo-router";
import { Input } from "@/components/input";
import { Button } from "@/components/Buttom";
import { colors } from "@/theme/colors";
import { authApi, extractApiErrorMessage } from "@/services/api";
import { tokenStorage } from "@/services/tokenStorage";
import React from "react";

export default function Index() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!email.trim() || !password.trim()) {
      return Alert.alert("Erro", "Preencha todos os campos");
    }

    setLoading(true);
    try {
      const response = await authApi.login({ email, senha: password });
      await tokenStorage.setToken(response.token);
      Alert.alert("Sucesso", "Login realizado com sucesso");
      // TODO: navegar para a Home / rota protegida quando existir
    } catch (error) {
      Alert.alert("Erro", extractApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.select({ ios: "padding", android: "height" })}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.brandSection}>
            <Text style={styles.brandTitle}>PetJoyful</Text>
            <Text style={styles.brandSubtitle}>Conectando Corações e Patas</Text>
            <Image
              source={require("@/assets/duke2.png")}
              style={styles.illustration}
              resizeMode="cover"
            />
          </View>

          <View style={styles.loginSection}>
            <Text style={styles.loginTitle}>Entrar</Text>

            <View style={styles.form}>
              <Input
                placeholder="Email ou nome de usuário"
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={setEmail}
                style={styles.formInput}
              />
              <Input
                placeholder="Digite sua senha..."
                secureTextEntry
                onChangeText={setPassword}
                style={styles.formInput}
              />
              <Button
                label={loading ? "Carregando..." : "Login"}
                variant="login"
                loading={loading}
                onPress={handleSignIn}
              />
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              <Button
                label="Continue com Google"
                variant="google"
                onPress={() => Alert.alert("Em breve", "Login social ainda não disponível")}
              />
              <Button
                label="Continue com Outlook"
                variant="apple"
                onPress={() => Alert.alert("Em breve", "Login social ainda não disponível")}
              />
            </View>

            <Text style={styles.footerText}>
              Não tem uma conta?{" "}
              <Link href="/signup" style={styles.footerLink}>
                Cadastre-se
              </Link>
            </Text>
          </View>

          <View style={styles.pageFooter}>
            <Text style={styles.pageFooterLink}>Sobre</Text>
            <Text style={styles.pageFooterLink}>Ajuda</Text>
            <Text style={styles.pageFooterLink}>Privacidade</Text>
            <Text style={styles.pageFooterLink}>Termos</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
    paddingTop: 24,
  },
  brandSection: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  brandTitle: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  brandSubtitle: {
    color: colors.white,
    fontSize: 15,
    textAlign: "center",
    marginTop: 8,
  },
  illustration: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    marginTop: 20,
  },
  loginSection: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 24,
  },
  loginTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 16,
  },
  form: {
    gap: 12,
  },
  formInput: {
    borderWidth: 0,
    borderRadius: 5,
    height: 46,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  dividerText: {
    color: colors.white,
    fontSize: 13,
  },
  socialButtons: {
    gap: 10,
  },
  footerText: {
    textAlign: "center",
    marginTop: 20,
    color: colors.white,
  },
  footerLink: {
    color: colors.white,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  pageFooter: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 24,
    marginBottom: 12,
  },
  pageFooterLink: {
    color: colors.textDark,
    fontSize: 13,
  },
});