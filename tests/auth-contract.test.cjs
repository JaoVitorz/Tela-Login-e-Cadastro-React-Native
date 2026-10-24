const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Executa os módulos reais com armazenamento, rede e navegação isolados.
// Nenhuma conta ou requisição de produção é usada nos testes.
function load(file, mocks) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
    },
  });
  const module = { exports: {} };
  vm.runInNewContext(
    outputText,
    {
      module,
      exports: module.exports,
      process: { env: {} },
      require(name) {
        if (Object.hasOwn(mocks, name)) return mocks[name];
        throw new Error(`Mock ausente: ${name}`);
      },
      ...mocks.globals,
    },
    { filename: file },
  );
  return module.exports;
}

const validToken = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIxIn0.signature';

function storageFixture(platform = 'web') {
  const values = new Map();
  const native = {
    getItemAsync: async (key) => values.get(key) ?? null,
    setItemAsync: async (key, value) => values.set(key, value),
    deleteItemAsync: async (key) => values.delete(key),
  };
  const exported = load('src/services/tokenStorage.ts', {
    'expo-secure-store': native,
    'react-native': { Platform: { OS: platform } },
    globals: {
      localStorage: {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
        removeItem: (key) => values.delete(key),
      },
    },
  });
  return { ...exported, values };
}

for (const platform of ['web', 'android']) {
  test(`${platform}: token inválido nunca é salvo e valores antigos são ignorados`, async () => {
    const { tokenStorage, values } = storageFixture(platform);
    for (const value of [undefined, null, '', 'undefined', 'null', 'challenge']) {
      await assert.rejects(() => tokenStorage.setToken(value));
      values.set('petjoyful_token', value);
      assert.equal(await tokenStorage.getToken(), null);
    }
    await tokenStorage.setToken(validToken);
    assert.equal(await tokenStorage.getToken(), validToken);
    await tokenStorage.removeToken();
    assert.equal(await tokenStorage.getToken(), null);
  });
}

test('renovação e encerramento da sessão notificam os componentes', async () => {
  const { tokenStorage, subscribeSession } = storageFixture();
  let calls = 0;
  const unsubscribe = subscribeSession(() => calls++);
  await tokenStorage.setToken(validToken);
  await tokenStorage.removeToken();
  unsubscribe();
  await tokenStorage.setToken(validToken);
  assert.equal(calls, 2);
});

function apiFixture() {
  const calls = [];
  let onRequest,
    onError,
    response = {};
  let token = validToken,
    removed = 0;
  const client = {
    interceptors: {
      request: {
        use(fn) {
          onRequest = fn;
        },
      },
      response: {
        use(success, failure) {
          onError = failure;
        },
      },
    },
  };
  for (const method of ['get', 'post', 'put', 'delete']) {
    client[method] = async (url, body) => {
      calls.push({ method, url, body });
      return { data: response };
    };
  }
  const exported = load('src/services/api.ts', {
    axios: { create: () => client, isAxiosError: (error) => !!error?.isAxiosError },
    '@/services/tokenStorage': {
      tokenStorage: {
        getToken: async () => token,
        removeToken: async () => {
          removed++;
          token = null;
        },
      },
    },
  });
  return {
    ...exported,
    calls,
    setResponse: (value) => {
      response = value;
    },
    request: (config) => onRequest(config),
    reject: (error) => onError(error),
    removed: () => removed,
  };
}

test('login: normaliza e-mail, mantém senha e retorna desafio MFA sem criar sessão', async () => {
  const f = apiFixture();
  const challenge = { mfaRequired: true, challengeToken: 'challenge' };
  f.setResponse(challenge);
  assert.equal(await f.authApi.login({ email: ' USER@Example.COM ', senha: ' senha ' }), challenge);
  assert.equal(f.calls[0].url, '/login');
  assert.equal(f.calls[0].body.email, 'user@example.com');
  assert.equal(f.calls[0].body.senha, ' senha ');
});

test('MFA: códigos TOTP e de recuperação seguem o contrato do backend', async () => {
  const f = apiFixture();
  await f.authApi.verifyMfa('challenge', { code: '123456' });
  await f.authApi.verifyMfa('challenge', { recoveryCode: 'recovery' });
  await f.authApi.setupMfa('password');
  await f.authApi.confirmMfa('654321');
  await f.authApi.cancelMfaSetup();
  await f.authApi.disableMfa({ password: 'password', code: '123456' });
  await f.authApi.regenerateMfaCodes({ password: 'password', recoveryCode: 'recovery' });
  assert.deepEqual(
    f.calls.map((c) => `${c.method} ${c.url}`),
    [
      'post /mfa/verify',
      'post /mfa/verify',
      'post /mfa/setup',
      'post /mfa/confirm',
      'delete /mfa/setup',
      'post /mfa/disable',
      'post /mfa/recovery-codes',
    ],
  );
  assert.equal(f.calls[0].body.challengeToken, 'challenge');
  assert.equal(f.calls[1].body.recoveryCode, 'recovery');
  assert.equal(f.calls[2].body.password, 'password');
  assert.equal(f.calls[3].body.code, '654321');
});

test('requisições públicas não recebem o token de uma sessão antiga', async () => {
  const f = apiFixture();
  for (const url of ['/login', '/register', '/mfa/verify']) {
    assert.equal((await f.request({ url, headers: {} })).headers.Authorization, undefined);
  }
  assert.equal(
    (await f.request({ url: '/me', headers: {} })).headers.Authorization,
    `Bearer ${validToken}`,
  );
});

test('somente rejeição da sessão atual encerra a sessão; código MFA errado não encerra', async () => {
  for (const [message, header, expected] of [
    ['Token inválido', `Bearer ${validToken}`, 1],
    ['Token inválido', 'Bearer old.token.signature', 0],
    ['Código inválido', `Bearer ${validToken}`, 0],
    ['Confirmação inválida', `Bearer ${validToken}`, 0],
  ]) {
    const f = apiFixture();
    const error = {
      response: { status: 401, data: { error: message } },
      config: { headers: { Authorization: header } },
    };
    await assert.rejects(f.reject(error));
    assert.equal(f.removed(), expected);
  }
});

function loginFixture(response) {
  const state = ['user@example.com', 'Password123', false, null, false, null, '', false];
  let cursor = 0,
    saved = [],
    navigated = [],
    verifications = [];
  const React = {
    createElement(type, props, ...children) {
      return { type, props: props || {}, children: children.flat(Infinity) };
    },
    useState(initial) {
      const i = cursor++;
      if (state[i] === undefined) state[i] = initial;
      return [
        state[i],
        (value) => {
          state[i] = typeof value === 'function' ? value(state[i]) : value;
        },
      ];
    },
    useCallback: (fn) => fn,
  };
  const screen = load('src/app/index.tsx', {
    react: React,
    'react-native': {
      View: 'View',
      ScrollView: 'ScrollView',
      Text: 'Text',
      Image: 'Image',
      Pressable: 'Pressable',
      KeyboardAvoidingView: 'KeyboardAvoidingView',
      ActivityIndicator: 'ActivityIndicator',
      StyleSheet: { create: (value) => value },
      Platform: { select: () => undefined },
    },
    'expo-router': {
      Link: 'Link',
      Redirect: 'Redirect',
      router: { replace: (route) => navigated.push(route) },
      useFocusEffect() {},
    },
    '@/components/input': { Input: 'Input' },
    '@/components/Buttom': { Button: 'Button' },
    '@/theme/colors': { colors: {} },
    '@/assets/duke2.png': {},
    '@/services/api': {
      authApi: {
        login: async () => response,
        verifyMfa: async (...args) => {
          verifications.push(args);
          return { token: validToken };
        },
      },
      extractApiErrorMessage: (error) => error.message,
    },
    '@/services/tokenStorage': {
      tokenStorage: {
        setToken: async (token) => {
          if (!token) throw new Error('token ausente');
          saved.push(token);
        },
      },
    },
  });
  function render() {
    cursor = 0;
    return screen.default();
  }
  function find(node, type, predicate = () => true) {
    if (!node || typeof node !== 'object') return;
    if (node.type === type && predicate(node.props)) return node;
    for (const child of node.children || []) {
      const match = find(child, type, predicate);
      if (match) return match;
    }
  }
  return { state, saved, navigated, verifications, render, find };
}

test('tela de login: só navega e salva o token depois de completar o MFA', async () => {
  const f = loginFixture({ mfaRequired: true, challengeToken: 'challenge' });
  await f.find(f.render(), 'Button').props.onPress();
  assert.deepEqual(f.saved, []);
  assert.deepEqual(f.navigated, []);
  assert.equal(f.state[1], ''); // senha removida da memória da tela
  let screen = f.render();
  f.find(
    screen,
    'Input',
    (props) => props.accessibilityLabel === 'Código do autenticador',
  ).props.onChangeText('123456');
  await f.find(f.render(), 'Button').props.onPress();
  assert.equal(f.verifications[0][0], 'challenge');
  assert.equal(f.verifications[0][1].code, '123456');
  assert.deepEqual(f.saved, [validToken]);
  assert.deepEqual(f.navigated, ['/(tabs)']);
});

test('tela de login: preserva caminho normal sem MFA', async () => {
  const f = loginFixture({ token: validToken, user: {} });
  await f.find(f.render(), 'Button').props.onPress();
  assert.deepEqual(f.saved, [validToken]);
  assert.deepEqual(f.navigated, ['/(tabs)']);
});

test('tela de login: código incompleto é recusado antes de chamar o backend', async () => {
  const f = loginFixture({ mfaRequired: true, challengeToken: 'challenge' });
  await f.find(f.render(), 'Button').props.onPress();
  f.find(
    f.render(),
    'Input',
    (props) => props.accessibilityLabel === 'Código do autenticador',
  ).props.onChangeText('123');
  await f.find(f.render(), 'Button').props.onPress();
  assert.equal(f.verifications.length, 0);
  assert.match(f.state[3], /6 dígitos/);
});

test('cadastro de ONG exige CPF válido do responsável', async () => {
  const { getRegistroSchema } = load('src/schema/registroschema.ts', { yup: require('yup') });
  const form = {
    nome: 'ONG Exemplo',
    sobrenome: 'Responsável',
    documento: '52998224725',
    email: 'ong@example.com',
    senha: 'Password123',
    confirmarSenha: 'Password123',
  };
  await getRegistroSchema('ong').validate(form);
  await assert.rejects(
    () => getRegistroSchema('ong').validate({ ...form, documento: '12345678000190' }),
    /CPF inválido/,
  );
});

function guardFixture({ token = validToken, validate = async () => ({ active: true }) } = {}) {
  const state = [true, '', 0];
  let cursor = 0,
    focus;
  const React = {
    createElement: (type, props, ...children) => ({ type, props, children }),
    useCallback: (fn) => fn,
    useState: (initial) => {
      const i = cursor++;
      if (state[i] === undefined) state[i] = initial;
      return [
        state[i],
        (value) => {
          state[i] = typeof value === 'function' ? value(state[i]) : value;
        },
      ];
    },
  };
  const { SessionGuard } = load('src/components/SessionGuard.tsx', {
    react: React,
    'react-native': {
      ActivityIndicator: 'ActivityIndicator',
      Text: 'Text',
      View: 'View',
      Pressable: 'Pressable',
      StyleSheet: { create: (styles) => styles },
      Platform: { OS: 'android' },
      AppState: { addEventListener: () => ({ remove() {} }) },
    },
    'expo-router': {
      useFocusEffect: (fn) => {
        focus = fn;
      },
      useNavigation: () => ({}),
      usePathname: () => '/perfil-profissional',
    },
    'lucide-react-native': { LogIn: 'LogIn' },
    '@/services/tokenStorage': {
      tokenStorage: { getToken: async () => token },
      subscribeSession: () => () => {},
    },
    '@/services/api': {
      authApi: { getSession: validate },
      extractApiErrorMessage: (error) => error.message,
    },
    '@/theme/colors': { colors: {} },
  });
  SessionGuard({ children: 'TabsNavigator' });
  return { state, focus: () => focus() };
}

test('sessão: mudar de aba não desmonta o navegador enquanto valida o token', async () => {
  let finish;
  const pending = new Promise((resolve) => {
    finish = resolve;
  });
  const f = guardFixture({ validate: () => pending });
  const cleanup = f.focus();
  assert.equal(f.state[0], true);
  finish({ active: true });
  await new Promise(setImmediate);
  assert.equal(f.state[0], true);
  cleanup();
});

test('sessão: falha temporária não apaga formulário MFA já aberto', async () => {
  const f = guardFixture({
    validate: async () => {
      throw new Error('Sem conexão');
    },
  });
  const cleanup = f.focus();
  await new Promise(setImmediate);
  assert.equal(f.state[0], true);
  cleanup();
});

test('sessão: ausência de token bloqueia as telas privadas', async () => {
  const f = guardFixture({ token: null });
  const cleanup = f.focus();
  await new Promise(setImmediate);
  assert.equal(f.state[0], false);
  cleanup();
});
