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
    useMemo: (fn) => fn(),
    useRef: (initial) => React.useState({ current: initial })[0],
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
      if (authorId === 'current-user') assert.equal(destinations[0], '/(tabs)/perfil-profissional');
      else {
        assert.equal(destinations[0].pathname, '/perfil-usuario');
        assert.equal(destinations[0].params.userId, authorId);
      }
    }
  }
});

function screenFixture({
  userId = 'author',
  getProfile = async () => ({ nome: 'Ana', bio: 'Adoro pets', cidade: 'Santos' }),
} = {}) {
  const r = reactFixture();
  const calls = [];
  const events = [
    { _id: 'other-event', organizer: 'author', title: 'Evento da Ana', currentParticipants: 3 },
    { _id: 'own-event', organizer: 'me', title: 'Meu evento', currentParticipants: 1 },
  ];
  const screen = load('src/components/ProfileScreen.tsx', {
    react: r.React,
    'react-native': native,
    'lucide-react-native': icons,
    'expo-router': {
      useFocusEffect: r.useFocusEffect,
      useNavigation: () => ({ reset() {} }),
      router: {},
    },
    'expo-image-picker': {},
    '@/components/input': { Input: 'Input' },
    '@/components/ProfilePosts': { ProfilePosts: 'ProfilePosts' },
    '@/theme/colors': { colors: {} },
    '@/services/api': {
      authApi: {
        getProfile: async () => {
          calls.push('own-account');
          return { user: { id: 'me', nome: 'Meu nome', email: 'me@example.test' } };
        },
      },
      extractApiErrorMessage: (error) => error.message,
    },
    '@/services/eventsApi': { eventsApi: { list: async () => ({ data: events }) } },
    '@/services/profileApi': {
      getProfileErrorMessage: (error) => error.message,
      profileApi: {
        getMyProfile: async () => {
          calls.push('own-profile');
          return { nome: 'Meu nome', foto_perfil: 'my-photo' };
        },
      },
    },
    '@/services/communityProfileApi': {
      getCommunityProfile: async (id) => {
        calls.push(id);
        const profile = await getProfile(id);
        return profile ? { profile, detailsAvailable: true } : null;
      },
    },
    '@/services/profilePhotoStore': {
      getStoredProfilePhoto: async () => {
        calls.push('own-photo');
        return null;
      },
      persistProfilePhoto: async () => {
        calls.push('persist-own-photo');
      },
      setProfilePhoto: () => {
        calls.push('global-photo');
      },
    },
    '@/services/profileCoverStore': {
      getStoredProfileCover: async () => {
        calls.push('own-cover');
        return 'my-cover';
      },
    },
    '@/services/tokenStorage': { tokenStorage: {} },
  });
  return {
    ...r,
    calls,
    renderScreen: () => r.render(screen.ProfileScreen, userId === null ? {} : { userId }),
  };
}

test('template: visitante usa dados do autor sem carregar conta, capa ou foto do usuário conectado', async () => {
  const f = screenFixture();
  f.renderScreen();
  f.focus();
  await new Promise(setImmediate);
  assert.deepEqual(f.calls, ['author']);
  const tree = f.renderScreen();
  const text = JSON.stringify(tree);
  assert.match(text, /Ana/);
  assert.match(text, /Adoro pets/);
  assert.match(text, /Santos/);
  assert.match(text, /PET JOYFUL/);
  assert.match(text, /Apresentação/);
  assert.equal(find(tree, (node) => node.type === 'ProfilePosts').props.userId, 'author');
  assert.doesNotMatch(
    text,
    /Editar perfil|Editar detalhes|Abrir menu da conta|Alterar foto|Adicionar capa|Excluir conta|Criar evento|Meu nome|me@example.test|my-cover|my-photo/,
  );
  assert.equal(
    find(tree, (node) => node.type === 'Modal'),
    undefined,
  );
});

test('publicações do perfil: paginação mantém o filtro do autor e ignora respostas depois de sair', async () => {
  const r = reactFixture();
  const requests = [];
  const post = (id) => ({ _id: id, titulo: `Publicação ${id}`, likes: [], comentarios: [] });
  let finish;
  const { ProfilePosts } = load('src/components/ProfilePosts.tsx', {
    react: r.React,
    'react-native': native,
    'expo-router': { useFocusEffect: r.useFocusEffect },
    '@/theme/colors': { colors: {} },
    '@/services/postsApi': {
      getPostsErrorMessage: (error) => error.message,
      postsApi: {
        listByAuthor: async (id, page) => {
          requests.push({ id, page });
          if (page === 3)
            return new Promise((resolve) => {
              finish = resolve;
            });
          return {
            data: page === 1 ? [post('first')] : [post('first'), post('second')],
            pagination: { pages: 3 },
          };
        },
      },
    },
  });
  const render = () => r.render(ProfilePosts, { userId: 'author' });
  render();
  const cleanup = r.focus();
  await new Promise(setImmediate);
  let tree = render();
  await find(tree, (node) => node.type === 'Pressable').props.onPress();
  await new Promise(setImmediate);
  tree = render();
  assert.equal(requests.length, 2);
  assert.ok(requests.every((request) => request.id === 'author'));
  assert.equal(requests[1].page, 2);
  const labels = content(tree);
  assert.equal(labels.split('Publicação first').length - 1, 1);
  assert.match(labels, /Publicação second/);
  const pending = find(tree, (node) => node.type === 'Pressable').props.onPress();
  cleanup();
  finish({ data: [post('stale')], pagination: { pages: 3 } });
  await pending;
  await new Promise(setImmediate);
  assert.doesNotMatch(content(render()), /Publicação stale/);
});

test('template: perfil próprio preserva edição, menu, foto e capa locais', async () => {
  const f = screenFixture({ userId: null });
  f.renderScreen();
  f.focus();
  await new Promise(setImmediate);
  const tree = f.renderScreen();
  const text = JSON.stringify(tree);
  assert.match(text, /Meu nome/);
  assert.match(text, /Editar perfil/);
  assert.match(text, /Abrir menu da conta/);
  assert.match(text, /my-cover/);
  assert.match(text, /PET JOYFUL|my-photo/);
  assert.equal(find(tree, (node) => node.type === 'ProfilePosts').props.userId, 'me');
  assert.ok(f.calls.includes('global-photo'));
  assert.ok(f.calls.includes('own-cover'));
  assert.ok(!f.calls.includes('author'));
});

function content(node) {
  if (typeof node === 'string') return node;
  return node && typeof node === 'object' ? (node.children || []).map(content).join('') : '';
}

test('template: abas Sobre e Eventos exibem informações do visitante e eventos do autor correto', async () => {
  const f = screenFixture();
  f.renderScreen();
  f.focus();
  await new Promise(setImmediate);
  let tree = f.renderScreen();
  find(tree, (node) => node.type === 'Pressable' && content(node) === 'Sobre').props.onPress();
  tree = f.renderScreen();
  assert.match(content(tree), /Ana/);
  assert.match(content(tree), /Santos/);
  assert.doesNotMatch(content(tree), /me@example.test|Editar/);
  find(tree, (node) => node.type === 'Pressable' && content(node) === 'Eventos').props.onPress();
  tree = f.renderScreen();
  assert.match(content(tree), /Eventos de Ana/);
  assert.equal(
    find(tree, (node) => node.type?.name === 'EventPreview').props.event._id,
    'other-event',
  );
  assert.equal(
    find(tree, (node) => node.props.event?._id === 'own-event'),
    undefined,
  );
  assert.doesNotMatch(content(tree), /Novo|Criar evento/);
});

test('template: perfil básico usa o mesmo visual com campos ainda não preenchidos', async () => {
  const f = screenFixture({ getProfile: async () => ({ nome: 'Ana' }) });
  f.renderScreen();
  f.focus();
  await new Promise(setImmediate);
  const text = JSON.stringify(f.renderScreen());
  assert.match(text, /Ana/);
  assert.match(text, /PET JOYFUL/);
  assert.match(text, /ainda não adicionou uma apresentação/);
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
  assert.match(content(f.renderScreen()), /Ana/);

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
  assert.doesNotMatch(content(stale.renderScreen()), /Resposta antiga/);
  assert.deepEqual(stale.calls, ['author']);
});

test('rotas: perfil próprio e visitante reutilizam o mesmo componente; link inválido não abre conta própria', () => {
  function SharedProfile() {}
  const r = reactFixture();
  const own = load('src/app/(tabs)/perfil-profissional.tsx', {
    react: r.React,
    '@/components/ProfileScreen': { ProfileScreen: SharedProfile },
  });
  assert.equal(r.render(own.default).type, SharedProfile);
  for (const userId of ['author', '', ['one', 'two']]) {
    const other = load('src/app/perfil-usuario.tsx', {
      react: r.React,
      'react-native': native,
      'expo-router': { useLocalSearchParams: () => ({ userId }) },
      '@/components/ProfileScreen': { ProfileScreen: SharedProfile },
      '@/components/SessionGuard': { SessionGuard: 'SessionGuard' },
      '@/components/AccountPage': { AccountPage: 'AccountPage', accountStyles: {} },
    });
    const tree = r.render(other.default);
    const profile = find(tree, (node) => node.type === SharedProfile);
    if (typeof userId === 'string' && userId) assert.equal(profile.props.userId, 'author');
    else {
      assert.equal(profile, undefined);
      assert.match(content(tree), /link não informa um perfil válido/);
    }
  }
});
