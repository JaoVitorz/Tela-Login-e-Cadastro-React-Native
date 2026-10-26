import {
  View,
  StyleSheet,
  Image,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useCallback, useState } from 'react';
import { Link, Redirect, router, useFocusEffect } from 'expo-router';
import { Input } from '@/components/input';
import { Button } from '@/components/Buttom';
import { colors } from '@/theme/colors';
import { authApi, extractApiErrorMessage } from '@/services/api';
import { tokenStorage } from '@/services/tokenStorage';
import React from 'react';

export default function Index() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void tokenStorage.getToken().then(async (token) => {
        if (!token) {
          if (active) setHasSession(false);
          return;
        }
        try {
          await authApi.getSession();
          if (active) setHasSession(true);
        } catch (error) {
          if (active) {
            setHasSession(false);
            setLoginError(extractApiErrorMessage(error));
          }
        }
      });
      return () => {
        active = false;
      };
    }, []),
  );

  async function handleSignIn() {
    if (loading) return;
    if (challengeToken) {
      const value = mfaCode.trim();
      if (useRecovery ? !/^[A-Za-z0-9_-]{22}$/.test(value) : !/^\d{6}$/.test(value)) {
        setLoginError(
          useRecovery
            ? 'Informe o código de recuperação completo.'
            : 'Informe os 6 dígitos do autenticador.',
        );
        return;
      }
      setLoading(true);
      setLoginError(null);
      try {
        const response = await authApi.verifyMfa(
          challengeToken,
          useRecovery ? { recoveryCode: value } : { code: value },
        );
        await tokenStorage.setToken(response.token);
        setChallengeToken(null);
        setMfaCode('');
        router.replace('/(tabs)');
      } catch (error) {
        setLoginError(extractApiErrorMessage(error));
      } finally {
        setLoading(false);
      }
      return;
    }
    if (!email.trim() || !password.trim()) {
      setLoginError('Preencha todos os campos');
      return;
    }

    setLoginError(null);
    setLoading(true);
    try {
      const response = await authApi.login({
        email: email.trim(),
        senha: password,
      });
      setPassword('');
      if ('mfaRequired' in response && response.mfaRequired) {
        if (!response.challengeToken)
          throw new Error('O servidor não retornou o desafio de autenticação.');
        setChallengeToken(response.challengeToken);
        setMfaCode('');
        setUseRecovery(false);
        return;
      }
      if (!('token' in response)) throw new Error('Resposta de login inválida.');
      await tokenStorage.setToken(response.token);
      router.replace('/(tabs)');
    } catch (error) {
      setLoginError(extractApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  if (hasSession === null) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.action} />
      </View>
    );
  }

  if (hasSession) return <Redirect href="/(tabs)" />;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.select({ ios: 'padding', android: 'height' })}
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
              source={require('@/assets/duke2.png')}
              style={styles.illustration}
              resizeMode="cover"
            />
          </View>

          <View style={styles.loginSection}>
            <Text style={styles.loginTitle}>Entrar</Text>

            <View style={styles.form}>
              {challengeToken ? (
                <>
                  <Text style={{ color: colors.textDark, textAlign: 'center' }}>
                    Verificação em duas etapas
                  </Text>
                  <Text style={{ color: colors.textDark, textAlign: 'center' }}>
                    Digite o código do seu autenticador ou use um código de recuperação. O desafio
                    expira em 5 minutos.
                  </Text>
                  <Input
                    accessibilityLabel={
                      useRecovery ? 'Código de recuperação' : 'Código do autenticador'
                    }
                    placeholder={useRecovery ? 'Código de recuperação' : '000000'}
                    value={mfaCode}
                    onChangeText={(value) => {
                      setMfaCode(value);
                      setLoginError(null);
                    }}
                    keyboardType={useRecovery ? 'default' : 'number-pad'}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={useRecovery ? 22 : 6}
                    onSubmitEditing={() => void handleSignIn()}
                  />
                  <Pressable
                    accessibilityRole="button"
                    disabled={loading}
                    style={{ padding: 12 }}
                    onPress={() => {
                      setUseRecovery(!useRecovery);
                      setMfaCode('');
                      setLoginError(null);
                    }}
                  >
                    <Text>
                      {useRecovery ? 'Usar aplicativo autenticador' : 'Usar código de recuperação'}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    disabled={loading}
                    style={{ padding: 12 }}
                    onPress={() => {
                      setChallengeToken(null);
                      setMfaCode('');
                      setLoginError(null);
                    }}
                  >
                    <Text>Voltar e iniciar outro login</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Input
                    placeholder="E-mail"
                    accessibilityLabel="E-mail"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={(value) => {
                      setEmail(value);
                      setLoginError(null);
                    }}
                    style={styles.formInput}
                  />
                  <Input
                    accessibilityLabel="Senha"
                    placeholder="Digite sua senha..."
                    secureTextEntry
                    value={password}
                    onChangeText={(value) => {
                      setPassword(value);
                      setLoginError(null);
                    }}
                    style={styles.formInput}
                  />
                </>
              )}
              {loginError && <Text style={styles.loginError}>{loginError}</Text>}
              <Button
                label={loading ? 'Carregando...' : challengeToken ? 'Verificar e entrar' : 'Login'}
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
                onPress={() => Alert.alert('Em breve', 'Login social ainda não disponível')}
              />
              <Button
                label="Continue com Outlook"
                variant="apple"
                onPress={() => Alert.alert('Em breve', 'Login social ainda não disponível')}
              />
            </View>

            <Text style={styles.footerText}>
              Não tem uma conta?{' '}
              <Link href="/signup" style={styles.footerLink}>
                Cadastre-se
              </Link>
            </Text>
          </View>

          <View style={styles.pageFooter}>
            <Text style={styles.pageFooterLink}>Sobre</Text>
            <Link href="/faq" style={styles.pageFooterLink}>
              Ajuda
            </Link>
            <Link href="/privacidade" style={styles.pageFooterLink}>
              Privacidade
            </Link>
            <Link href="/politicas" style={styles.pageFooterLink}>
              Políticas
            </Link>
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
    alignItems: 'center',
    marginBottom: 20,
  },
  brandTitle: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  brandSubtitle: {
    color: colors.white,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
  },
  illustration: {
    width: '100%',
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
    fontWeight: '800',
    textAlign: 'center',
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
  loginError: {
    color: colors.white,
    fontSize: 13,
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    color: colors.white,
    fontSize: 13,
  },
  socialButtons: {
    gap: 10,
  },
  footerText: {
    textAlign: 'center',
    marginTop: 20,
    color: colors.white,
  },
  footerLink: {
    color: colors.white,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  pageFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 24,
    marginBottom: 12,
  },
  pageFooterLink: {
    color: colors.textDark,
    fontSize: 13,
  },
});
