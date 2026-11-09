const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

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
      URL,
      require: (name) => {
        if (Object.hasOwn(mocks, name)) return mocks[name];
        throw new Error(`Mock ausente: ${name}`);
      },
    },
    { filename: file },
  );
  return module.exports;
}

function apiFixture({ data, error } = {}) {
  const calls = [];
  const client = {
    interceptors: { request: { use() {} } },
    get: async (url) => {
      calls.push(url);
      if (error) throw error;
      return { data: { success: true, data } };
    },
  };
  return {
    ...load('src/services/profileApi.ts', {
      axios: { create: () => client, isAxiosError: (error) => !!error?.isAxiosError },
      '@/services/tokenStorage': { tokenStorage: { getToken: async () => 'session' } },
    }),
    calls,
  };
}

test('perfil: consulta o ID do autor e seleciona somente dados de apresentação', async () => {
  const f = apiFixture({
    data: {
      userId: 'author-id',
      nome: 'Ana',
      bio: 'Tutora de pets',
      cidade: 'Santos',
      estado: 'SP',
      foto_perfil: '/photos/ana.jpg',
      telefone: 'private-phone',
      email: 'private-email',
      endereco: 'private-address',
      data_nascimento: 'private-birth-date',
    },
  });
  const profile = await f.profileApi.getProfileByUserId(' author/id ');
  assert.deepEqual(f.calls, ['/author%2Fid']);
  assert.equal(profile.nome, 'Ana');
  assert.equal(
    profile.foto_perfil,
    'https://edicao-perfil-microservice.onrender.com/photos/ana.jpg',
  );
  for (const field of ['telefone', 'email', 'endereco', 'data_nascimento']) {
    assert.equal(Object.hasOwn(profile, field), false);
  }
});

test('perfil: diferencia ausência de perfil de sessão recusada e falha de rede', async () => {
  const missing = apiFixture({
    error: {
      isAxiosError: true,
      response: { status: 404, data: { message: 'Perfil não encontrado' } },
    },
  });
  assert.equal(await missing.profileApi.getProfileByUserId('author'), null);
  for (const error of [
    { isAxiosError: true, response: { status: 401 } },
    new Error('Sem conexão'),
  ]) {
    const f = apiFixture({ error });
    await assert.rejects(f.profileApi.getProfileByUserId('author'), (caught) => caught === error);
  }
  const f = apiFixture();
  await assert.rejects(f.profileApi.getProfileByUserId('  '), /não informado/);
  assert.deepEqual(f.calls, []);
});

test('perfil: rota ausente e resposta sem dados não são confundidas com perfil não preenchido', async () => {
  for (const data of [{ message: 'Rota não encontrada' }, '<html>Not found</html>']) {
    const f = apiFixture({ error: { isAxiosError: true, response: { status: 404, data } } });
    await assert.rejects(f.profileApi.getProfileByUserId('author'), /consulta por usuário/);
  }
  await assert.rejects(
    apiFixture().profileApi.getProfileByUserId('author'),
    /não retornou os dados/,
  );
});

function communityFixture({
  profile = null,
  author = { userId: 'author', nome: 'Ana' },
  error,
} = {}) {
  let authorCalls = 0;
  const { getCommunityProfile } = load('src/services/communityProfileApi.ts', {
    '@/services/profileApi': {
      profileApi: {
        getProfileByUserId: async () => {
          if (error) throw error;
          return profile;
        },
      },
    },
    '@/services/postsApi': {
      postsApi: {
        getAuthor: async () => {
          authorCalls++;
          return author;
        },
      },
      getPostsErrorMessage: (error) => error.message,
    },
  });
  return { getCommunityProfile, authorCalls: () => authorCalls };
}

test('comunidade: autor sem registro de perfil abre com identificação básica', async () => {
  const f = communityFixture();
  const result = await f.getCommunityProfile('author');
  assert.equal(result.profile.nome, 'Ana');
  assert.equal(result.profile.userId, 'author');
  assert.equal(result.detailsAvailable, false);
  assert.equal(f.authorCalls(), 1);
  const missing = communityFixture({ author: null });
  assert.equal(await missing.getCommunityProfile('unknown'), null);
});

test('comunidade: dados preenchidos têm prioridade; falhas no serviço continuam visíveis', async () => {
  const profile = { userId: 'author', nome: 'Nome atualizado', bio: 'Minha bio' };
  const full = communityFixture({ profile });
  const result = await full.getCommunityProfile('author');
  assert.equal(result.profile, profile);
  assert.equal(result.detailsAvailable, true);
  assert.equal(full.authorCalls(), 0);
  const failure = communityFixture({ error: new Error('Sem conexão') });
  await assert.rejects(failure.getCommunityProfile('author'), /Sem conexão/);
  assert.equal(failure.authorCalls(), 0);
});

test('posts: consulta autor por ID, ignora outro autor e não retorna dados de contato', async () => {
  for (const returnedId of ['author', 'different-author']) {
    let request;
    const { postsApi } = load('src/services/postsApi.ts', {
      axios: {
        create: () => ({
          interceptors: { request: { use() {} } },
          get: async (url, config) => {
            request = { url, config };
            return {
              data: { data: [{ autor: { userId: returnedId, nome: 'Ana', email: 'private' } }] },
            };
          },
        }),
      },
      '@/services/tokenStorage': { tokenStorage: {} },
    });
    const author = await postsApi.getAuthor('author');
    assert.equal(request.config.params.userId, 'author');
    assert.equal(request.config.params.limit, 1);
    if (returnedId === 'author') {
      assert.equal(author.nome, 'Ana');
      assert.equal(Object.hasOwn(author, 'email'), false);
    } else assert.equal(author, null);
  }
});

test('perfil: foto inválida usa fallback sem impedir a consulta', async () => {
  for (const foto_perfil of ['javascript:alert(1)', 'http://[', undefined]) {
    const f = apiFixture({ data: { nome: 'Ana', foto_perfil } });
    assert.equal((await f.profileApi.getProfileByUserId('author')).foto_perfil, undefined);
  }
});

function reactFixture() {
  const frames = new Map();
  let current, cursor, focus;
  const React = {
    Fragment: 'Fragment',
    createElement: (type, props, ...children) => ({
      type,
      props: { ...props, children: children.flat(Infinity) },
      children: children.flat(Infinity),
    }),
    useCallback: (fn) => fn,
    useState: (initial) => {
      const frame = current;
      const index = cursor++;
      if (!(index in frame)) frame[index] = initial;
      return [
        frame[index],
        (value) => {
          frame[index] = typeof value === 'function' ? value(frame[index]) : value;
        },
      ];
    },
  };
  return {
    React,
    useFocusEffect: (fn) => {
      focus = fn;
    },
    focus: () => focus(),
    render: (component, props = {}, initial = []) => {
      if (!frames.has(component)) frames.set(component, initial);
      current = frames.get(component);
      cursor = 0;
      return component(props);
    },
  };
}

function find(node, predicate) {
  if (!node || typeof node !== 'object') return;
  if (predicate(node)) return node;
  for (const child of node.children || []) {
    const result = find(child, predicate);
    if (result) return result;
  }
}

const native = Object.fromEntries(
  ['View', 'Text', 'Pressable', 'Image', 'ActivityIndicator', 'Modal', 'TextInput'].map((name) => [
    name,
    name,
  ]),
);
native.StyleSheet = { create: (styles) => styles };
native.Platform = { OS: 'web' };
const icons = Object.fromEntries(
  [
    'Heart',
    'ImagePlus',
    'MessageCircle',
    'PawPrint',
    'Pencil',
    'Trash2',
    'X',
    'CalendarDays',
    'MapPin',
    'UserRound',
  ].map((name) => [name, name]),
);

test('feed: nome e foto abrem o perfil usando o ID do autor da publicação', () => {
  for (const authorId of ['other-user', 'current-user', undefined]) {
    const r = reactFixture();
    const destinations = [];
    const { HomeFeed } = load('src/components/HomeFeed.tsx', {
      react: r.React,
      'react-native': native,
      'expo-image-picker': {},
      'expo-router': {
        useFocusEffect: r.useFocusEffect,
        router: { push: (url) => destinations.push(url) },
      },
      'lucide-react-native': icons,
      '@/services/postsApi': {},
      '@/components/ProfileAvatar': { ProfileAvatar: 'ProfileAvatar' },
      '@/theme/colors': { colors: {} },
    });
    const post = {
      _id: 'post',
      autor: { userId: authorId, nome: 'Ana' },
      likes: [],
      comentarios: [],
    };
    const feed = r.render(HomeFeed, { authorName: 'Eu', userId: 'current-user' }, [[post]]);
    const card = find(feed, (node) => node.type?.name === 'PostCard');
    const rendered = r.render(card.type, card.props);
    const link = find(rendered, (node) => node.props.accessibilityRole === 'link');
    assert.equal(link.props.accessibilityLabel, 'Ver perfil de Ana');
    assert.equal(link.props.disabled, !authorId);
    if (authorId) {
      link.props.onPress();
      assert.equal(destinations[0].pathname, '/perfil-usuario');
      assert.equal(destinations[0].params.userId, authorId);
    }
  }
});

function screenFixture({
  userId = 'author',
  getProfile = async () => null,
  detailsAvailable = true,
} = {}) {
  const r = reactFixture();
  const calls = [];
  const screen = load('src/app/perfil-usuario.tsx', {
    react: r.React,
    'react-native': native,
    'lucide-react-native': icons,
    'expo-router': { useFocusEffect: r.useFocusEffect, useLocalSearchParams: () => ({ userId }) },
    '@/components/AccountPage': { AccountPage: 'AccountPage', accountStyles: {} },
    '@/components/SessionGuard': { SessionGuard: 'SessionGuard' },
    '@/theme/colors': { colors: {} },
    '@/services/profileApi': {
      getProfileErrorMessage: (error) => error.message,
    },
    '@/services/communityProfileApi': {
      getCommunityProfile: async (id) => {
        calls.push(id);
        const profile = await getProfile(id);
        return profile ? { profile, detailsAvailable } : null;
      },
    },
  });
  const root = r.render(screen.default);
  assert.equal(root.type, 'SessionGuard');
  const child = root.children[0];
  return { ...r, calls, renderScreen: () => r.render(child.type, child.props) };
}

test('tela: carrega perfil do autor em modo de consulta e usa fallback para nome ausente', async () => {
  const f = screenFixture({
    getProfile: async () => ({ nome: '', bio: 'Adoro pets', cidade: 'Santos' }),
  });
  f.renderScreen();
  f.focus();
  await new Promise(setImmediate);
  assert.deepEqual(f.calls, ['author']);
  const node = find(f.renderScreen(), (node) => node.type?.name === 'ProfileDetails');
  const details = f.render(node.type, node.props);
  const text = JSON.stringify(details);
  assert.match(text, /Usuário da comunidade/);
  assert.match(text, /Adoro pets/);
  assert.match(text, /Santos/);
  assert.doesNotMatch(text, /Editar perfil/);
});

test('tela: perfil ausente e link inválido têm mensagens específicas', async () => {
  const missing = screenFixture();
  missing.renderScreen();
  missing.focus();
  await new Promise(setImmediate);
  assert.match(JSON.stringify(missing.renderScreen()), /Perfil ainda não disponível/);
  for (const userId of ['', ['one', 'two']]) {
    const invalid = screenFixture({ userId });
    invalid.renderScreen();
    invalid.focus();
    assert.match(JSON.stringify(invalid.renderScreen()), /link não informa um perfil válido/);
    assert.deepEqual(invalid.calls, []);
  }
});

test('tela: conta sem informações extras exibe nome e explica os campos ausentes', async () => {
  const f = screenFixture({ getProfile: async () => ({ nome: 'Ana' }), detailsAvailable: false });
  f.renderScreen();
  f.focus();
  await new Promise(setImmediate);
  const node = find(f.renderScreen(), (node) => node.type?.name === 'ProfileDetails');
  const text = JSON.stringify(f.render(node.type, node.props));
  assert.match(text, /Ana/);
  assert.match(text, /apenas o nome está disponível/);
  assert.doesNotMatch(text, /Perfil ainda não disponível/);
});

test('tela: permite tentar novamente após falha e ignora respostas depois de sair', async () => {
  let attempts = 0;
  const f = screenFixture({
    getProfile: async () => {
      if (++attempts === 1) throw new Error('Sem conexão');
      return { nome: 'Ana' };
    },
  });
  f.renderScreen();
  f.focus();
  await new Promise(setImmediate);
  let tree = f.renderScreen();
  assert.match(JSON.stringify(tree), /Sem conexão/);
  find(tree, (node) => node.type === 'Pressable').props.onPress();
  f.renderScreen();
  f.focus();
  await new Promise(setImmediate);
  assert.ok(find(f.renderScreen(), (node) => node.type?.name === 'ProfileDetails'));

  let finish;
  const stale = screenFixture({
    getProfile: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  stale.renderScreen();
  const cleanup = stale.focus();
  cleanup();
  finish({ nome: 'Resposta antiga' });
  await new Promise(setImmediate);
  assert.equal(
    find(stale.renderScreen(), (node) => node.type?.name === 'ProfileDetails'),
    undefined,
  );
});
