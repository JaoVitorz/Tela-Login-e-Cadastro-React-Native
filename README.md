# PetJoyful Mobile

Aplicativo multiplataforma da comunidade **PetJoyful**, desenvolvido para levar ao celular a experiência da plataforma web. O app reúne autenticação, acesso ao perfil, publicações da comunidade e eventos ligados ao universo pet em uma interface construída com React Native e Expo. A aplicação também pode ser executada na web para facilitar desenvolvimento e validação.

> Este repositório contém o cliente mobile. Autenticação, perfil, publicações e eventos são integrados a serviços HTTP separados; cada serviço pode ser configurado por variável de ambiente.

## Objetivo

O PetJoyful aproxima tutores, pessoas interessadas em adoção, ONGs e profissionais veterinários. A versão mobile adapta os fluxos da plataforma web para uma experiência responsiva, com navegação por abas, formulários próprios para dispositivos móveis e integração com os serviços existentes.

## Recursos implementados

- **Cadastro e login:** formulários com validação, mensagens de erro e suporte aos perfis adotante, ONG e veterinário.
- **Sessão autenticada:** armazenamento do token e proteção das áreas privadas do app.
- **Feed da comunidade:** consulta de publicações, criação e edição de posts, curtidas, comentários e exclusão de conteúdo.
- **Imagens de publicações:** envio de imagem junto à criação ou edição de post.
- **Eventos:** listagem integrada ao serviço de eventos, filtros, visualização de detalhes, inscrições e cancelamentos.
- **Gestão de eventos:** formulário para criar e editar eventos, com datas, horários, categorias e informações de local.
- **Perfil:** consulta e edição de informações do perfil, integração com o serviço de perfil e exibição de foto no ícone da navegação.
- **Armazenamento de mídia local:** persistência de foto e capa de perfil, com tratamento específico para web e dispositivos nativos.
- **Exclusão de conta:** ação disponível no menu do perfil, conectada ao backend de autenticação.
- **Adoções:** tela demonstrativa com exemplos de animais. Os dados exibidos nessa área são estáticos no código atual.
- **Web e mobile:** base compartilhada para Android, iOS e navegador, com componentes e navegação do Expo.

## Tecnologias

| Área | Tecnologia | Uso |
| --- | --- | --- |
| Aplicativo | React Native 0.81 | Interface nativa multiplataforma |
| Linguagem | TypeScript 5.9 | Tipagem da aplicação e dos contratos da API |
| Plataforma | Expo SDK 54 | Execução e recursos para Android, iOS e web |
| Rotas | Expo Router 6 | Rotas baseadas em arquivos e navegação por abas |
| Navegação | React Navigation 7 | Infraestrutura de navegação do aplicativo |
| Requisições | Axios | Comunicação HTTP com backend e microsserviços |
| Formulários | Yup | Validação dos dados de cadastro e login |
| Sessão nativa | Expo SecureStore | Armazenamento seguro do token em Android e iOS |
| Arquivos | Expo FileSystem | Persistência local de imagens em dispositivos nativos |
| Fotos | Expo ImagePicker | Seleção de imagens do dispositivo |
| Datas e horários | React Native DateTimePicker | Seleção de data e hora nos fluxos de eventos |
| Ícones | Lucide React Native e Expo Symbols | Elementos visuais da interface |
| Animações | React Native Reanimated | Suporte a animações da interface |
| Estilos vetoriais | React Native SVG | Renderização de conteúdo SVG |
| Execução web | React Native Web | Reutilização da interface em navegadores |

## Arquitetura do cliente

O app usa a estrutura de rotas do Expo Router. As telas ficam em `src/app`, organizadas por rota e grupo de navegação. A comunicação com os serviços está concentrada em `src/services`; os contratos compartilhados ficam em `src/types`, as validações em `src/schema` e os componentes reutilizáveis em `src/components`.

```text
src/
├── app/                 # Rotas, telas e layouts
│   └── (tabs)/          # Início, adoções, eventos e perfil
├── assets/              # Imagens usadas nas telas
├── components/          # Componentes reutilizáveis e proteção de sessão
├── schema/              # Validação dos formulários
├── services/            # Clientes HTTP e armazenamento local
├── theme/               # Cores e tokens visuais
└── types/               # Tipos de domínio e contratos das APIs
```

## Requisitos

- Node.js compatível com Expo SDK 54.
- npm.
- Expo Go em um dispositivo compatível ou um emulador Android/iOS para execução nativa.

## Instalação e execução

```bash
git clone https://github.com/JaoVitorz/Tela-Login-e-Cadastro-React-Native.git
cd Tela-Login-e-Cadastro-React-Native
npm install
npm start
```

No terminal do Expo, escolha abrir no Android, iOS ou web. Também é possível iniciar diretamente cada destino:

```bash
npm run android
npm run ios
npm run web
```

A versão web usa a porta `3000`. Para desenvolver, também é possível executar o projeto em um dispositivo físico pelo Expo Go ou emulador.

<<<<<<< HEAD
## Configuração dos serviços
=======
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
>>>>>>> adab43e32e083a0c4eed2cd9f1f9e8a87ba7a2be

Copie `.env.example` para `.env` e ajuste as URLs conforme o ambiente. Os valores abaixo são os serviços padrão atualmente definidos pelo projeto:

| Variável | Serviço | Padrão |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | Autenticação e conta | `https://pet-joyful-backend.onrender.com` |
| `EXPO_PUBLIC_EVENTS_API_URL` | Eventos | `https://pet-joyful-events-service.onrender.com` |
| `EXPO_PUBLIC_PROFILE_API_URL` | Perfil profissional | `https://edicao-perfil-microservice.onrender.com` |
| `EXPO_PUBLIC_POSTS_API_URL` | Publicações da comunidade | `https://pet-joyful-posts-service.onrender.com` |

Exemplo de `.env`:

```dotenv
EXPO_PUBLIC_API_URL=https://pet-joyful-backend.onrender.com
EXPO_PUBLIC_EVENTS_API_URL=https://pet-joyful-events-service.onrender.com
EXPO_PUBLIC_PROFILE_API_URL=https://edicao-perfil-microservice.onrender.com
EXPO_PUBLIC_POSTS_API_URL=https://pet-joyful-posts-service.onrender.com
```

Para um backend local, configure a URL que o dispositivo ou navegador consegue alcançar. No emulador Android padrão, o host da máquina costuma ser acessado por `10.0.2.2`; em um dispositivo físico, use o endereço IP da máquina na rede local. A configuração `EXPO_PUBLIC_*` é incorporada ao cliente: não coloque segredos, chaves privadas ou credenciais nessas variáveis.

Após alterar as variáveis, reinicie o servidor Expo para carregar a configuração atualizada.

## Sessão e armazenamento

As requisições autenticadas recebem o token salvo pelo app. Em Android e iOS, o token e referências locais de mídia usam `expo-secure-store`; na web, o projeto usa `localStorage` para compatibilidade com navegador. Arquivos de capa são armazenados no diretório de documentos do app nos dispositivos nativos.

O componente `SessionGuard` protege a navegação autenticada e atualiza o estado da sessão ao voltar ao app. Os clientes HTTP centralizam URLs, timeout, token e mensagens de erro para cada serviço.

## Estado atual e escopo

Este repositório é a adaptação mobile da plataforma PetJoyful e compartilha a integração com os serviços do produto. Algumas áreas da versão web podem não estar disponíveis no app ainda. A tela de adoções contém dados demonstrativos, e os fluxos de MFA, FAQ e políticas não estão implementados neste cliente no estado atual do código.

O app possui integração de exclusão de conta. A exportação de dados LGPD, caso necessária no mobile, ainda precisa de uma tela e integração próprias.

## Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `npm start` | Inicia o servidor de desenvolvimento do Expo |
| `npm run android` | Inicia o projeto com destino Android |
| `npm run ios` | Inicia o projeto com destino iOS |
| `npm run web` | Inicia a versão web na porta 3000 |

## Repositório

[Tela de Login e Cadastro — React Native](https://github.com/JaoVitorz/Tela-Login-e-Cadastro-React-Native)
