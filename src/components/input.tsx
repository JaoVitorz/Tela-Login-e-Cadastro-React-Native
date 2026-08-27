import { View, TextInput, Text, StyleSheet, TextInputProps } from "react-native";
import { useState } from "react";
import { colors } from "@/theme/colors";
import React from "react";

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
};

// Mantém a assinatura original (spread de props do TextInput), adicionando
// suporte opcional a label + mensagem de erro para replicar o formulário
// de cadastro do Next.js (.form-field label / .form-field span).
export function Input({ label, error, style, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[
          styles.input,
          focused && styles.inputFocused,
          !!error && styles.inputInvalid,
          style,
        ]}
        placeholderTextColor={colors.placeholder}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 7,
  },
  label: {
    color: colors.textLabel,
    fontSize: 12,
    fontWeight: "700",
  },
  input: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    fontSize: 16,
    paddingLeft: 14,
    color: colors.textDark,
    backgroundColor: colors.white,
  },
  inputFocused: {
    borderColor: colors.inputFocus,
  },
  inputInvalid: {
    borderColor: colors.errorBorder,
  },
  error: {
    color: colors.error,
    fontSize: 12,
    lineHeight: 16,
  },
});