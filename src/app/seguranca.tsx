import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { AccountPage, accountStyles as s } from '@/components/AccountPage';
import { SessionGuard } from '@/components/SessionGuard';
import { Input } from '@/components/input';
import { authApi, extractApiErrorMessage } from '@/services/api';
import { tokenStorage } from '@/services/tokenStorage';
import { colors } from '@/theme/colors';
import type { MfaSetupResponse } from '@/types/auth';

export default function SecurityScreen() {
  return (
    <SessionGuard>
      <SecuritySettings />
    </SessionGuard>
  );
}

function SecuritySettings() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [recovery, setRecovery] = useState(false);
  const [setup, setSetup] = useState<MfaSetupResponse | null>(null);
  const [codes, setCodes] = useState<string[]>([]);
  const [action, setAction] = useState<'disable' | 'regenerate' | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      setEnabled((await authApi.getMfaStatus()).enabled);
    } catch (error) {
      setError(extractApiErrorMessage(error));
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function run(operation: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await operation();
    } catch (error) {
      setError(extractApiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  function resetProof() {
    setPassword('');
    setCode('');
    setRecovery(false);
  }

  async function startSetup() {
    if (!password) throw new Error('Informe sua senha atual.');
    const result = await authApi.setupMfa(password);
    if (!result.secret || !result.otpauthUrl || !result.expiresAt)
      throw new Error('Configuração MFA inválida recebida do servidor.');
    setSetup(result);
    resetProof();
  }

  async function confirmSetup() {
    if (!/^\d{6}$/.test(code.trim())) throw new Error('Informe os 6 dígitos do autenticador.');
    if (!setup || new Date(setup.expiresAt).getTime() <= Date.now())
      throw new Error('Configuração expirada. Cancele e inicie novamente.');
    const result = await authApi.confirmMfa(code.trim());
    // Guarde os códigos em memória antes de renovar a sessão.
    setCodes(result.recoveryCodes);
    setEnabled(true);
    setSetup(null);
    resetProof();
    await tokenStorage.setTokens(result.token, result.refreshToken);
    setNotice('Verificação em duas etapas ativada. Guarde seus códigos de recuperação.');
  }

  async function changeMfa() {
    if (!password) throw new Error('Informe sua senha atual.');
    const value = code.trim();
    if (recovery ? !/^[A-Za-z0-9_-]{22}$/.test(value) : !/^\d{6}$/.test(value))
      throw new Error('Informe um código válido.');
    const proof = { password, ...(recovery ? { recoveryCode: value } : { code: value }) };
    if (action === 'disable') {
      const result = await authApi.disableMfa(proof);
      setEnabled(false);
      setCodes([]);
      resetProof();
      setAction(null);
      await tokenStorage.setToken(result.token);
      setNotice('Verificação em duas etapas desativada.');
    } else if (action === 'regenerate') {
      const result = await authApi.regenerateMfaCodes(proof);
      setCodes(result.recoveryCodes);
      resetProof();
      setAction(null);
      await tokenStorage.setToken(result.token);
      setNotice('Novos códigos gerados. Os códigos anteriores foram invalidados.');
    }
  }

  function button(label: string, onPress: () => void, secondary = false) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: busy }}
        disabled={busy}
        style={[secondary ? s.secondary : s.button, busy && { opacity: 0.5 }]}
        onPress={onPress}
      >
        <Text style={secondary ? s.secondaryText : s.buttonText}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <AccountPage
      title="Segurança da conta"
      subtitle="Proteja seu acesso com senha e um código gerado no seu aplicativo autenticador."
    >
      <View style={s.card}>
        <ShieldCheck color={colors.brandPanel} size={32} />
        <Text style={s.title}>Verificação em duas etapas</Text>
        <Text style={s.text}>
          {enabled === null
            ? 'Consultando proteção da conta…'
            : enabled
              ? 'Ativada · sua conta tem uma segunda etapa de proteção.'
              : 'Desativada · adicione uma camada de proteção à sua conta.'}
        </Text>
        {enabled === null && !busy && button('Consultar novamente', () => void load(), true)}
        {busy && <ActivityIndicator color={colors.brandPanel} accessibilityLabel="Processando" />}
        {!!error && (
          <Text accessibilityRole="alert" style={s.error}>
            {error}
          </Text>
        )}
        {!!notice && (
          <Text accessibilityLiveRegion="polite" style={s.success}>
            {notice}
          </Text>
        )}
      </View>

      {codes.length > 0 ? (
        <View style={s.card}>
          <Text style={s.title}>Guarde seus códigos agora</Text>
          <Text style={s.text}>
            Estes códigos são exibidos apenas nesta etapa. Cada código pode ser usado uma vez para
            entrar se você perder acesso ao autenticador. Guarde-os em um local seguro, fora desta
            conta.
          </Text>
          {codes.map((value, index) => (
            <Text selectable style={s.text} key={value}>
              {index + 1}. {value}
            </Text>
          ))}
          {button('Já guardei meus códigos', () => setCodes([]))}
        </View>
      ) : setup ? (
        <View style={s.card}>
          <Text style={s.title}>Conecte seu autenticador</Text>
          <Text style={s.text}>
            No Google Authenticator, Microsoft Authenticator ou outro app TOTP, adicione uma conta
            com chave manual. Selecione códigos baseados em tempo e use esta chave:
          </Text>
          <Text selectable style={[s.success, { fontSize: 18, letterSpacing: 2 }]}>
            {setup.secret}
          </Text>
          <Text style={s.text}>
            A configuração expira em {new Date(setup.expiresAt).toLocaleTimeString('pt-BR')}. Não
            compartilhe esta chave.
          </Text>
          {button(
            'Abrir no aplicativo autenticador',
            () =>
              void run(async () => {
                await Linking.openURL(setup.otpauthUrl);
              }),
            true,
          )}
          <Input
            label="Código de 6 dígitos"
            accessibilityLabel="Código de 6 dígitos"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            autoComplete="one-time-code"
          />
          {button('Confirmar e ativar MFA', () => void run(confirmSetup))}
          {button(
            'Cancelar configuração',
            () =>
              void run(async () => {
                await authApi.cancelMfaSetup();
                setSetup(null);
                resetProof();
              }),
            true,
          )}
        </View>
      ) : enabled === false ? (
        <View style={s.card}>
          <Text style={s.title}>Ativar proteção</Text>
          <Text style={s.text}>
            Confirme sua senha para receber uma chave de configuração. O MFA só será ativado depois
            da confirmação do código.
          </Text>
          <Input
            label="Senha atual"
            accessibilityLabel="Senha atual"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
          />
          {button('Configurar autenticador', () => void run(startSetup))}
        </View>
      ) : enabled === true ? (
        <View style={s.card}>
          <Text style={s.title}>Gerenciar proteção</Text>
          {!action ? (
            <>
              {button(
                'Gerar novos códigos de recuperação',
                () => {
                  resetProof();
                  setAction('regenerate');
                },
                true,
              )}
              {button(
                'Desativar verificação em duas etapas',
                () => {
                  resetProof();
                  setAction('disable');
                },
                true,
              )}
            </>
          ) : (
            <>
              <Text style={s.text}>
                {action === 'disable'
                  ? 'Confirme para desativar a segunda etapa de proteção.'
                  : 'Os códigos anteriores deixarão de funcionar. Confirme para gerar novos códigos.'}{' '}
                Use um código novo do autenticador; códigos já utilizados não são aceitos.
              </Text>
              <Input
                label="Senha atual"
                accessibilityLabel="Senha atual"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
              />
              <Input
                label={recovery ? 'Código de recuperação' : 'Código do autenticador'}
                accessibilityLabel={recovery ? 'Código de recuperação' : 'Código do autenticador'}
                value={code}
                onChangeText={setCode}
                keyboardType={recovery ? 'default' : 'number-pad'}
                maxLength={recovery ? 22 : 6}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {button(
                recovery ? 'Usar autenticador' : 'Usar código de recuperação',
                () => {
                  setRecovery(!recovery);
                  setCode('');
                },
                true,
              )}
              {button(
                action === 'disable' ? 'Confirmar desativação' : 'Confirmar novos códigos',
                () => void run(changeMfa),
              )}
              {button(
                'Cancelar',
                () => {
                  setAction(null);
                  resetProof();
                },
                true,
              )}
            </>
          )}
        </View>
      ) : null}
    </AccountPage>
  );
}
