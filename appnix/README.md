# AppNix

Aplicativo mobile-first de turismo, gastronomia e exploração urbana gamificada. O usuário visita locais reais, faz check-ins fotográficos validados por GPS, ganha pontos, sobe de nível e interage com a comunidade.

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS v4 · motion/react · lucide-react · Leaflet · Firebase 12 (Auth, Firestore, Storage) · Capacitor 8 (Android).

---

## Início rápido

```bash
cd appnix
npm install
npm run dev:app      # app em tela cheia → http://localhost:5173/index.app.html
npm run dev          # site (landing + app dentro de um DeviceFrame)
npm test             # testes unitários (níveis, Haversine, pontuação)
```

Sem as variáveis `VITE_FIREBASE_*` o app roda em **modo demonstração**: os dados ficam no `localStorage`, com usuários e posts de exemplo, e uma opção "simular que estou no local" no check-in. Dá para testar todas as telas sem backend.

## Builds separados (web e app)

| | Web (site/PWA) | App (Android) |
|---|---|---|
| Entrypoint | `index.html` → `src/main.tsx` | `index.app.html` → `src/main-app.tsx` |
| Config | `vite.config.ts` | `vite.app.config.ts` |
| Saída | `dist/` | `dist-app/` (renomeia para `index.html`, que o Capacitor carrega) |
| Conteúdo | `LandingPage` + `<DeviceFrame isEmbedded />` | só `<DeviceFrame isEmbedded={false} />` |

`src/site/` é importado apenas pelo entrypoint web, então nenhum código do site vai para o APK/AAB.

## Configurar o Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com).
2. **Authentication** → ative *E-mail/senha* e *Google*.
3. Crie o **Firestore** e o **Storage**.
4. Registre um app **Web** e copie as chaves para `appnix/.env` (modelo em `.env.example`).
5. Publique regras e índices:
   ```bash
   npm i -g firebase-tools && firebase login
   firebase use --add
   firebase deploy --only firestore:rules,firestore:indexes,storage
   ```
6. Popule missões e trilhas (precisa de uma *service account* em Configurações → Contas de serviço):
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json npm run seed
   ```
   Para editar o conteúdo depois, use o console do Firestore (`missions`, `achievements`). Os campos `image` e `bannerUrl` são opcionais: sem eles o app mostra um gradiente com o ícone da categoria.

## Android (Capacitor)

Requisitos: Android Studio, JDK 21 e Android SDK 36.

```bash
npm run cap:sync     # build:app + cap sync android
npm run cap:open     # abre no Android Studio (Run ▶ ou Build → Generate Signed Bundle)
```

### Google Sign-In e Push no Android

O login Google nativo (`@capacitor-firebase/authentication`) e o push (`@capacitor/push-notifications`, FCM) precisam do Firebase nativo:

1. No Firebase Console, adicione um app **Android** com o pacote `com.appnix.app`.
2. Cadastre o **SHA-1** e o **SHA-256** do keystore (debug: `cd android && ./gradlew signingReport`).
3. Baixe o `google-services.json` para `android/app/` (está no `.gitignore`).
4. No `.env`, defina `VITE_ENABLE_PUSH=true`.
5. Rode `npm run cap:sync`.

O `capacitor.config.ts` só inclui esses dois plugins quando existe `android/app/google-services.json`. Sem o arquivo, o APK continua abrindo normalmente (login por e-mail, câmera e GPS funcionam), em vez de fechar ao iniciar.

Permissões já declaradas no `AndroidManifest.xml`: internet, localização (fina e aproximada, só em primeiro plano), câmera, leitura de imagens e notificações (Android 13+). O `FileProvider` da câmera já vem do template do Capacitor.

### APK pelo GitHub Actions

O workflow `.github/workflows/appnix-android.yml` roda os testes, gera o `dist-app` e compila um **APK debug**, que fica disponível como artefato da execução. Secrets opcionais: `VITE_FIREBASE_*`, `VITE_GOOGLE_MAPS_API_KEY` e `GOOGLE_SERVICES_JSON_BASE64` (o `google-services.json` em base64).

Ícone e splash nativos: os PNGs-fonte ficam em `assets/` (ícone, camada da frente, fundo e splash claro/escuro). Para regerar, rode `npx capacitor-assets generate --android --assetPath assets` e mantenha o `mipmap-anydpi-v26/ic_launcher.xml` sem `inset`, porque a camada da frente já respeita a zona segura. O ícone vetorial está em `public/icon.svg` e o componente do logo em `src/components/Logo.tsx`.

## Estrutura

```
src/
├── main.tsx / main-app.tsx     entrypoints web / app
├── components/                 DeviceFrame, AppShell, BottomNav, BottomSheet, PullToRefresh, ui
├── screens/                    Splash, Login, Home, Map, Feed, Social, Checkin, Profile, Legal
├── hooks/useApp.tsx            estado global (auth, perfil, missões, GPS, notificações, toasts)
├── services/
│   ├── types.ts                modelos de dados + interface Backend
│   ├── firebaseBackend.ts      implementação Firebase (Auth/Firestore/Storage)
│   ├── demoBackend.ts          implementação local (modo demo)
│   └── rules.ts                regras de pontuação e de trilhas (compartilhadas)
├── lib/                        levels (getUserLevelInfo), geo (Haversine), geocode (Google/Nominatim), native (Capacitor)
└── site/LandingPage.tsx        só no build web
```

## Modelo de dados

As coleções seguem a especificação (`users`, `missions`, `achievements`, `checkins`, `feedEvents` + `comments`, `notifications`), com estes campos a mais:

- `users.nameLower`: busca de amigos por prefixo.
- `feedEvents.userLevel` e `feedEvents.rating`: badge de nível e estrelas no card do feed.
- `friendships/{uidA_uidB}`: `{ users, requesterId, requesterName, requesterAvatar, targetId, targetName, targetAvatar, status: 'pending' | 'accepted', createdAt }`.

O check-in roda em uma **transação**: valida que o local ainda não foi visitado, soma os pontos (em dobro quando `isDoublePoints`), aplica o bônus das trilhas concluídas, atualiza o nível, incrementa `completions` e publica no feed.

## Segurança e LGPD

- `firestore.rules`: cada usuário só altera os próprios dados. Pontos e check-ins nunca diminuem. Kudos só alteram o próprio UID. Notificações só são lidas pelo destinatário. Amizades só são aceitas pelo convidado.
- **Anti-fraude:** a pontuação é calculada no cliente. Para produção em escala, mova `performCheckin` para uma Cloud Function (callable) que valide a distância no servidor e grave os pontos com o Admin SDK, e bloqueie a escrita de `points` nas regras.
- **Exclusão de conta (Art. 18):** reautentica, apaga check-ins, posts e comentários (inclusive os feitos em posts de outras pessoas), amizades, notificações, fotos no Storage e o perfil, e por fim a conta no Auth.
- Os textos de Termos, Privacidade e Cookies estão em `src/screens/LegalScreen.tsx`. Revise com o jurídico e troque o e-mail do encarregado (`privacidade@appnix.com.br`).
