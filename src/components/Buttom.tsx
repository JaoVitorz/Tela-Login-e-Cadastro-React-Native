import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";
import { colors } from "@/theme/colors";
import React from "react";

type ButtonVariant = "login" | "google" | "apple" | "action";

type ButtonProps = TouchableOpacityProps & {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
};

// variant "login": botão branco com texto verde (.btn-login / tela de login)
// variant "google" / "apple": botões secundários com borda (login social)
// variant "action": botão verde sólido (.submit-button / tela de cadastro)
export function Button({
  label,
  variant = "login",
  loading = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        variantStyles[variant],
        isDisabled && disabledStyles[variant],
        style,
      ]}
      activeOpacity={0.7}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor[variant]} />
      ) : (
        <Text style={[styles.label, { color: textColor[variant] }]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
  },
});

const variantStyles = StyleSheet.create({
  login: {
    backgroundColor: colors.white,
  },
  google: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.loginBtnText,
  },
  apple: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.appleBorder,
  },
  action: {
    backgroundColor: colors.action,
    height: 48,
    marginTop: 6,
  },
});

const disabledStyles = StyleSheet.create({
  login: { opacity: 0.7 },
  google: { opacity: 0.7 },
  apple: { opacity: 0.7 },
  action: { backgroundColor: colors.actionDisabled },
});

const textColor: Record<ButtonVariant, string> = {
  login: colors.loginBtnText,
  google: colors.loginBtnText,
  apple: colors.appleBorder,
  action: colors.white,
};
