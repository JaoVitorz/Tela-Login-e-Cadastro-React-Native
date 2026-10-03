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

Escaneie o QR Code com o aplicativo **Expo Go** (disponível para Android e iOS) ou execute em um emulador.

---

## 📸 Telas

| Login | Cadastro |
|-------|----------|
| Tela de autenticação com e-mail e senha | Tela de criação de conta com formulário |

---

## 👨‍💻 Autor

Feito por [JaoVitorz](https://github.com/JaoVitorz)
