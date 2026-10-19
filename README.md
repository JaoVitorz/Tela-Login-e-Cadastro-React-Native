# 📱 Tela de Login e Cadastro — React Native

Interface de autenticação desenvolvida com **React Native** e **TypeScript**, contendo telas de **Login** e **Cadastro** com visual moderno e responsivo.

---

## 🚀 Tecnologias

- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [TypeScript](https://www.typescriptlang.org/)

---

## 📂 Estrutura do Projeto

```
├── assets/
│   └── images/          # Imagens e ícones do app
├── src/                 # Código-fonte principal
├── app.json             # Configurações do Expo
├── tsconfig.json        # Configurações do TypeScript
├── package.json         # Dependências do projeto
└── .gitignore
```

---

## ⚙️ Como rodar o projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) instalado
- [Expo CLI](https://docs.expo.dev/get-started/installation/) instalado globalmente

```bash
npm install -g expo-cli
```

### Instalação

```bash
# Clone o repositório
git clone https://github.com/JaoVitorz/Tela-Login-e-Cadastro-React-Native.git

# Acesse a pasta do projeto
cd Tela-Login-e-Cadastro-React-Native

# Instale as dependências
npm install
```

### Executando

```bash
npx expo start
```

Para abrir a versão web com a origem permitida pelo serviço de postagens:

```bash
npm run web
```

O feed da Home usa `EXPO_PUBLIC_POSTS_API_URL`. Sem um arquivo `.env`, o app usa
`https://pet-joyful-posts-service.onrender.com`. Para apontar para uma instância
local, configure essa variável com a URL acessível pelo navegador ou dispositivo.

### Conta, segurança e privacidade

O login aceita a resposta normal `{ token, user }` e o desafio MFA
`{ mfaRequired: true, challengeToken }`. No segundo caso, a sessão só é criada
depois da confirmação em `/api/auth/mfa/verify`, com código do autenticador ou
código de recuperação. Tokens ausentes ou malformados não são armazenados.

No perfil, o menu da conta oferece **Segurança e MFA**, **FAQ**, **Políticas e
normas** e **Privacidade e LGPD**. A configuração MFA usa chave manual TOTP ou
abertura do autenticador instalado; a confirmação, a desativação e a renovação
dos códigos substituem o token local pelo novo token retornado pelo backend.
Os códigos de recuperação ficam apenas na memória da tela e devem ser guardados
pelo usuário antes de sair dela.

O backend principal exige CPF para todas as contas. Para ONG, o formulário pede
o CPF do responsável. As categorias ONG e veterinário continuam mapeadas para
`cliente`, conforme o enum do backend; CNPJ e CRMV não são enviados como se
fossem persistidos ou verificados.

A página LGPD descreve as funções disponíveis e aponta a lei oficial. O
responsável pelo projeto precisa complementar identificação do controlador,
canal de privacidade, bases legais, retenção e compartilhamento antes de
publicá-la como política definitiva.

Validação local, sem usar contas de produção:

```bash
npm run test:auth
npx tsc --noEmit
```

Escaneie o QR Code com o aplicativo **Expo Go** (disponível para Android e iOS) ou execute em um emulador.

---

## 📸 Telas

| Login | Cadastro |
|-------|----------|
| Tela de autenticação com e-mail e senha | Tela de criação de conta com formulário |

---

## 👨‍💻 Autor

Feito por [JaoVitorz](https://github.com/JaoVitorz)
