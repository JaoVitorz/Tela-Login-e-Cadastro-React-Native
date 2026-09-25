import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useState } from "react";
import { Link, router } from "expo-router";
import { PawPrint, Building2, Stethoscope, type LucideIcon } from "lucide-react-native";
import { ValidationError } from "yup";
import { Input } from "@/components/input";
import { Button } from "@/components/Buttom";
import { colors } from "@/theme/colors";
import { getRegistroSchema, type TipoRegistro } from "@/schema/registroschema";
import { authApi, extractApiErrorMessage } from "@/services/api";
import { tokenStorage } from "@/services/tokenStorage";
import React from "react";

const profileOptions: Array<{ value: TipoRegistro; label: string; icon: LucideIcon }> = [
  { value: "adotante", label: "Adotante", icon: PawPrint },
  { value: "ong", label: "ONG", icon: Building2 },
  { value: "veterinario", label: "Veterinario", icon: Stethoscope },
];

const fieldCopy = {
  adotante: {
    nome: "Nome",
    sobrenome: "Sobrenome",
    documento: "CPF",
    documentoPlaceholder: "000.000.000-00",
    emailPlaceholder: "seu@email.com",
  },
  ong: {
    nome: "Nome da ONG",
    sobrenome: "Responsavel",
    documento: "CNPJ",
    documentoPlaceholder: "00.000.000/0000-00",
    emailPlaceholder: "contato@ong.org",
  },
  veterinario: {
    nome: "Nome",
    sobrenome: "Sobrenome",
    documento: "CPF",
    documentoPlaceholder: "000.000.000-00",
    emailPlaceholder: "profissional@email.com",
  },
} as const;

type FormValues = {
  nome: string;
  sobrenome: string;
  documento: string;
  crmv: string;
  email: string;
  senha: string;
  confirmarSenha: string;
};

const initialValues: FormValues = {
  nome: "",
  sobrenome: "",
  documento: "",
  crmv: "",
  email: "",
  senha: "",
  confirmarSenha: "",
};

export default function Signup() {
  const [tipoUsuario, setTipoUsuario] = useState<TipoRegistro>("adotante");
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const copy = fieldCopy[tipoUsuario];

  function setField<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function selectTipo(tipo: TipoRegistro) {
    setTipoUsuario(tipo);
    setServerError(null);
    setErrors({});
  }

  async function handleSignUp() {
    setServerError(null);

    try {
      await getRegistroSchema(tipoUsuario).validate(values, { abortEarly: false });
      setErrors({});
    } catch (validationError) {
      if (validationError instanceof ValidationError) {
        const fieldErrors: Partial<Record<keyof FormValues, string>> = {};
        validationError.inner.forEach((issue) => {
          if (issue.path && !fieldErrors[issue.path as keyof FormValues]) {
            fieldErrors[issue.path as keyof FormValues] = issue.message;
          }
        });
        setErrors(fieldErrors);
      }
      return;
    }

    setSubmitting(true);
    try {
      const nome = tipoUsuario === "ong"
        ? `${values.nome} - ${values.sobrenome}`.trim()
        : `${values.nome} ${values.sobrenome}`.trim();
      const response = await authApi.register({
        nome,
        email: values.email,
        senha: values.senha,
        tipo: tipoUsuario,
        ...(tipoUsuario === "ong"
          ? { cnpj: values.documento.replace(/\D/g, "") }
          : { cpf: values.documento.replace(/\D/g, "") }),
        ...(tipoUsuario === "veterinario" ? { crmv: values.crmv } : {}),
      });
      await tokenStorage.setToken(response.token);
      Alert.alert("Conta criada", "Bem-vindo(a) à comunidade PetJoyful!");
      router.replace("/(tabs)");
    } catch (error) {
      setServerError(extractApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.white }}
      behavior={Platform.select({ ios: "padding", android: "height" })}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* .registro-brand-panel */}
        <View style={styles.brandPanel}>
          <View style={styles.brandMark}>
            <View style={styles.brandDot} />
            <Text style={styles.brandMarkText}>PetJoyful</Text>
          </View>

          <View style={styles.brandCopy}>
            <Text style={styles.brandHeading}>
              A comunidade que conecta pets a lares amorosos
            </Text>
            <Text style={styles.brandParagraph}>
              Adote, ajude e compartilhe histórias reais de animais que
              encontraram sua família.
            </Text>

            <View style={styles.brandList}>
              {[
                "Perfil completo para tutores e ONGs",
                "Feed de pets disponíveis para adoção",
                "Histórias de adoção inspiradoras",
                "Conexão com veterinários confiáveis",
              ].map((item) => (
                <View key={item} style={styles.brandListItem}>
                  <View style={styles.brandListBullet} />
                  <Text style={styles.brandListText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.brandStat}>
            +2.400 famílias já encontraram seu pet aqui
          </Text>
        </View>

        {/* .registro-form-panel */}
        <View style={styles.formPanel}>
          <View style={styles.formHeading}>
            <Text style={styles.formHeadingTitle}>Criar sua conta</Text>
            <Text style={styles.formHeadingSubtitle}>
              Escolha seu perfil e comece agora
            </Text>
          </View>

          {/* .profile-tabs */}
          <View style={styles.tabs}>
            {profileOptions.map(({ value, label, icon: Icon }) => {
              const active = tipoUsuario === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.tabButton, active && styles.tabButtonActive]}
                  activeOpacity={0.7}
                  onPress={() => selectTipo(value)}
                >
                  <Icon
                    size={14}
                    strokeWidth={2.2}
                    color={active ? colors.tabActiveText : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      active && { color: colors.tabActiveText },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.form}>
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Input
                  label={copy.nome}
                  placeholder={copy.nome}
                  value={values.nome}
                  onChangeText={(t) => setField("nome", t)}
                  error={errors.nome}
                />
              </View>
              <View style={styles.rowItem}>
                <Input
                  label={copy.sobrenome}
                  placeholder={copy.sobrenome}
                  value={values.sobrenome}
                  onChangeText={(t) => setField("sobrenome", t)}
                  error={errors.sobrenome}
                />
              </View>
            </View>

            <Input
              label={copy.documento}
              placeholder={copy.documentoPlaceholder}
              value={values.documento}
              onChangeText={(t) => setField("documento", t)}
              error={errors.documento}
            />

            {tipoUsuario === "veterinario" && (
              <Input
                label="CRMV"
                placeholder="SP12345"
                autoCapitalize="characters"
                value={values.crmv}
                onChangeText={(t) => setField("crmv", t)}
                error={errors.crmv}
              />
            )}

            <Input
              label="E-mail"
              placeholder={copy.emailPlaceholder}
              keyboardType="email-address"
              autoCapitalize="none"
              value={values.email}
              onChangeText={(t) => setField("email", t)}
              error={errors.email}
            />

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Input
                  label="Senha"
                  placeholder="********"
                  secureTextEntry
                  value={values.senha}
                  onChangeText={(t) => setField("senha", t)}
                  error={errors.senha}
                />
              </View>
              <View style={styles.rowItem}>
                <Input
                  label="Confirmar senha"
                  placeholder="********"
                  secureTextEntry
                  value={values.confirmarSenha}
                  onChangeText={(t) => setField("confirmarSenha", t)}
                  error={errors.confirmarSenha}
                />
              </View>
            </View>

            {serverError && (
              <View style={styles.serverError}>
                <Text style={styles.serverErrorText}>{serverError}</Text>
              </View>
            )}

            <Button
              label={submitting ? "Criando conta..." : "Criar conta no PetJoyful"}
              variant="action"
              loading={submitting}
              onPress={handleSignUp}
            />

            <Text style={styles.loginLink}>
              Já tem uma conta?{" "}
              <Link href="/" style={styles.loginLinkAnchor}>
                Fazer login
              </Link>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  brandPanel: {
    backgroundColor: colors.brandPanel,
    padding: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  brandMark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
  },
  brandMarkText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "800",
  },
  brandCopy: {
    marginTop: 32,
  },
  brandHeading: {
    color: colors.white,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
  },
  brandParagraph: {
    color: colors.whiteMuted,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 16,
  },
  brandList: {
    gap: 12,
    marginTop: 24,
  },
  brandListItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandListBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  brandListText: {
    color: colors.whiteSoft,
    fontSize: 14,
    flexShrink: 1,
  },
  brandStat: {
    color: colors.whiteFaint,
    fontSize: 13,
    marginTop: 32,
  },
  formPanel: {
    padding: 20,
    paddingTop: 28,
    paddingBottom: 40,
  },
  formHeading: {
    marginBottom: 20,
  },
  formHeadingTitle: {
    color: colors.textDark,
    fontSize: 26,
    fontWeight: "800",
  },
  formHeadingSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 8,
  },
  tabs: {
    flexDirection: "row",
    gap: 6,
    padding: 6,
    borderRadius: 10,
    backgroundColor: colors.tabsBackground,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    minHeight: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: colors.white,
    shadowColor: "#111827",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  tabLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  form: {
    gap: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  serverError: {
    padding: 12,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    borderRadius: 8,
    backgroundColor: colors.errorBackground,
  },
  serverErrorText: {
    color: colors.errorText,
    fontSize: 13,
  },
  loginLink: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  loginLinkAnchor: {
    color: colors.textLabel,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
