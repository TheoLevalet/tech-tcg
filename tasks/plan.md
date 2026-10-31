# Plan : connexion utilisateur (api-deploy, auth-core, auth-web, auth-mobile)

## Context

L'utilisateur veut la première fonctionnalité de tech-tcg : un utilisateur peut créer un compte, se connecter et se déconnecter, sur le web et le mobile. Les specs approuvées sont sur la branche locale `feat/auth-specs`, non commitées : `CAPABILITY-MAP.md`, `SPEC-api-deploy.md`, `SPEC-auth-core.md`, `SPEC-auth-web.md`, `SPEC-auth-mobile.md`. Le profil passe par l'API Fastify (choix de l'utilisateur : Cloud Functions), donc l'API doit d'abord être déployée. `auth-mobile-google` est hors plan (pas encore de spec).

Autonomie accordée : j'applique Terraform, je merge chaque PR quand sa CI est verte et je vérifie le déploiement, sans m'arrêter sauf en cas d'échec.

## Organisation

- **Fichiers de suivi** : les anciens `tasks/plan.md` et `tasks/todo.md` (init monorepo, terminés ; seules restent décochées des cases de critères) sont déplacés dans `tasks/archive/init-monorepo-{plan,todo}.md`. Ce plan devient `tasks/plan.md`, les tâches détaillées `tasks/todo.md` (format existant : description, critères, vérification, dépendances, fichiers, taille).
- **Commit préparatoire** sur `feat/auth-specs` : specs + carte + plan + archive, puis cette branche devient la PR du module `api-deploy`.
- **Une PR par module**, mergée (`--merge`, sans `--delete-branch` tant qu'une PR empilée existe) une fois la CI verte, dans l'ordre `api-deploy` → `auth-core` → `auth-web` → `auth-mobile`. Chaque branche part de `main` à jour : pas de PR empilée.
- Un commit par tâche, `Co-authored-by: Claude Code (TechTown)`.

## Phase A : api-deploy (branche `feat/auth-specs`)

**A1. Module Terraform `api-runtime`** (`infra/terraform/modules/api-runtime/`, instancié dans `envs/dev/main.tf`)

- Compte `api-runtime` + `roles/datastore.user`.
- Dépôt Artifact Registry `gcf-artifacts` (`europe-west1`, DOCKER) avec règle de nettoyage (garder les 3 plus récentes, supprimer le reste après 1 jour). Cloud Functions réutilise ce dépôt s'il existe.
- `roles/cloudbuild.builds.builder` pour `343922114869-compute@developer.gserviceaccount.com` (le compte de build existe déjà).
- `github-deployer` : remplacer `run.viewer` par `run.admin` (rendre la fonction publique), ajouter `cloudfunctions.developer` ; `iam.serviceAccountUser` sur `api-runtime` et sur le compte de build, au niveau du compte, pas du projet.
- Vérif : `validate`, `fmt -check`, `plan` relu, `apply`, puis `plan` → « No changes ».

**A2. Options de la fonction** : `apps/api/src/index.ts` ajoute `serviceAccount: "api-runtime@"` et `invoker: "public"`. Vérif : `pnpm --filter @tech-tcg/api build`, emulator Functions → `/health` ok.

**A3. Workflow** : `git mv .github/workflows/deploy-hosting.yml deploy.yml`, nom « Deploy », `--only hosting,functions`. Vérif : `actionlint`.

**A4. README + SPEC.md** (section Déploiement continu : périmètre élargi à l'API).

**Checkpoint A** : PR verte → merge → run « Deploy » vert → `curl https://tech-tcg-dev.web.app/api/health` = `200 {"status":"ok"}`, page web « API : ok », `gcloud functions describe api --region europe-west1` montre `api-runtime`. En cas de `403` : ajouter le rôle nommé dans le log, `apply`, relancer le workflow (`gh workflow run deploy.yml`).

## Phase B : auth-core (branche `feat/auth-core`)

**B1. Schémas** `packages/shared/src/profile.ts` : `pseudoSchema` (trim, 3–20, `[A-Za-z0-9_-]`), `updateProfileRequestSchema` (strict), `userProfileSchema` (`uid`, `email` optionnel, `pseudo`, `createdAt` ISO). Tests RED → GREEN dans `packages/shared/test/profile.test.ts`.

**B2. Client d'API** `packages/shared/src/api-client.ts` : `createApiClient({ baseUrl, getIdToken })` → `health()`, `getMe()` (retourne `null` sur 404), `updateMe(pseudo)` ; `ApiError { status, code }`. Réponses parsées par les schémas. Tests avec `fetch` simulé (en-tête `Authorization`, 401, 404, 400, réponse invalide).

**B3. API, unitaires** :

- `apps/api/src/app.ts` : `buildApp(deps: AppDependencies, options)` avec `verifyIdToken` et `profiles` injectés (code style de la spec). Mettre à jour `test/health.test.ts` et `test/request-handler.test.ts` pour passer des dépendances factices.
- `src/auth.ts` : plugin qui lit `Authorization: Bearer`, appelle `verifyIdToken`, pose `request.user = { uid, email }`, sinon `401 {"error":"unauthenticated"}` (aucun détail, aucun log du jeton).
- `src/profiles.ts` : interface `ProfileStore { get(uid), upsert(uid, pseudo) }` + `createFirestoreProfileStore(db)` (transaction : `createdAt` posé seulement à la création).
- `src/routes/me.ts` : `GET /me`, `PUT /me` selon le tableau de la spec ; validation par les schémas de `shared`.
- `test/me.test.ts` : un test par ligne du tableau, store en mémoire défini dans `test/`.

**B4. Branchement réel** `src/index.ts` : `initializeApp()`, `getAuth().verifyIdToken`, `createFirestoreProfileStore(getFirestore())`. Vérif : build + emulator Functions.

**B5. Intégration** : `apps/api/vitest.integration.config.ts` (inclut `test/integration/**`, exclu de `vitest run`), script `test:integration`. Le test crée un utilisateur via l'API REST de l'emulator Auth (`signUp` avec clé factice), appelle `PUT /me` puis `GET /me` via `inject()`, relit `users/{uid}` dans l'emulator Firestore. Lancé par `pnpm exec firebase emulators:exec --only auth,firestore --project demo-tech-tcg "pnpm --filter @tech-tcg/api test:integration"`. CI : job `integration` dans `ci.yml` (setup-java temurin 21, cache `~/.cache/firebase/emulators`).

- Risque : le téléchargement des emulators a échoué dans mon environnement (réseau du bac à sable). Relancer hors bac à sable ; à défaut, la CI fait foi.

**Checkpoint B** : tests verts (unitaires + intégration), PR verte → merge → déploiement vert → `GET https://tech-tcg-dev.web.app/api/me` sans jeton = `401`.

## Phase C : auth-web (branche `feat/auth-web`)

**C1. Config Firebase** :

- Terraform : `data "google_firebase_web_app_config"` dans `modules/firebase`, sorties `web_api_key`, `web_auth_domain`, `web_app_id` ; `apply` ; `gh variable set --env dev` `FIREBASE_WEB_API_KEY`, `FIREBASE_WEB_AUTH_DOMAIN`, `FIREBASE_WEB_APP_ID`.
- `deploy.yml` : ces variables + `GCP_PROJECT_ID` passées en `VITE_FIREBASE_*` à l'étape de build.
- Pas de `.env` versionné : en développement, `firebase.ts` prend par défaut le projet `demo-tech-tcg` et les emulators.
- `apps/web/src/firebase.ts` : config validée par Zod (erreur claire si variable manquante), `connectAuthEmulator` si emulators.

**C2. Messages d'erreur** `packages/shared/src/auth-errors.ts` : code Firebase → message français, message générique pour code inconnu, « Email ou mot de passe incorrect » pour `invalid-credential`/`wrong-password`/`user-not-found`. Placé directement dans `shared` (commun avec le mobile) ; ajuster la phrase correspondante de `SPEC-auth-mobile.md`.

**C3. AuthProvider + gardes** : `src/auth/AuthProvider.tsx` (contexte : `user`, `loading`, `signIn`, `signUp`, `signInWithGoogle`, `resetPassword`, `signOut`, `getIdToken`) ; `src/api.tsx` (`ApiProvider` autour de `createApiClient({ baseUrl: "/api", getIdToken })`) ; `RequireAuth` et `RedirectIfAuthenticated` (état `from` pour le retour). Tests des redirections avec des contextes factices, aucun rendu tant que `loading`.

**C4. Pages** `src/pages/` : `Connexion`, `Inscription` (signUp puis `updateMe`), `MotDePasseOublie` (message identique dans tous les cas), `Accueil` (`getMe` ; si `null`, formulaire de pseudo prérempli avec `displayName` ; sinon pseudo, email, déconnexion). Router dans `main.tsx` ; `App.tsx` et son test remplacés. Un fichier de test par page (validation, appel attendu, message d'erreur, redirection). Labels, `autocomplete`, mot de passe ≥ 8.

**C5. Vérif navigateur locale** : `pnpm emulators` + preview `tech-tcg-web` : inscription, déconnexion, reconnexion, oubli, Google via l'IdP factice de l'emulator, compte sans profil ; document visible dans l'UI des emulators.

**Checkpoint C** : PR verte → merge → déploiement vert → sur `https://tech-tcg-dev.web.app` : inscription email, déconnexion, reconnexion ; `users/{uid}` présent dans Firestore. Connexion Google déployée : à vérifier seulement si l'utilisateur a activé Google dans la console, sinon signalé comme restant.

## Phase D : auth-mobile (branche `feat/auth-mobile`)

**D1. Config** : dépendances `firebase` (13.1.0) et `@react-native-async-storage/async-storage@2.2.0` (version d'Expo SDK 58). `apps/mobile/src/firebase.ts` : `initializeAuth` + `getReactNativePersistence(AsyncStorage)`, emulators sur l'hôte de Metro (`Constants.expoConfig.hostUri`). `tsconfig` mobile : `customConditions: ["react-native"]` pour les types de `getReactNativePersistence`. Valeurs de démonstration par défaut en développement, comme sur le web ; URL d'API = emulator Functions en local, `EXPO_PUBLIC_API_URL` sinon.

**D2. AuthProvider mobile** : même contrat que le web (`src/auth/AuthProvider.tsx`), sans Google ; client d'API de `shared`.

**D3. Écrans** : `app/(auth)/_layout.tsx` (redirige si connecté), `connexion`, `inscription`, `mot-de-passe-oublie` ; `app/(app)/_layout.tsx` (redirige si non connecté), `accueil` (formulaire de pseudo si profil absent). `app/index.tsx` redirige selon l'état. Claviers et `textContentType` adaptés. Tests Jest par écran ; l'ancien test de `draw()` est retiré avec l'écran.

**D4. Vérif simulateur iOS** : `pnpm emulators` + `expo start --ios` (Expo Go) : parcours complet, relance de l'app toujours connecté ; puis contre `tech-tcg-dev` avec un compte créé sur le web (`EXPO_PUBLIC_USE_EMULATORS=false`, `EXPO_PUBLIC_API_URL=https://tech-tcg-dev.web.app/api`, config web de Terraform). Risque : installation d'Expo Go dans le simulateur (réseau) ; à défaut, `expo export` + tests, et vérification simulateur signalée comme restante.

**Checkpoint D** : PR verte → merge. Pas de déploiement mobile (EAS hors périmètre).

## Fichiers critiques

- `apps/api/src/{app,index,request-handler}.ts`, nouveaux `auth.ts`, `profiles.ts`, `routes/me.ts`
- `packages/shared/src/{index,profile,api-client,auth-errors}.ts`
- `apps/web/src/{main,firebase,api}.tsx?`, `auth/`, `pages/`
- `apps/mobile/app/**`, `apps/mobile/src/**`
- `infra/terraform/modules/{api-runtime,firebase}/`, `infra/terraform/envs/dev/main.tf`
- `.github/workflows/{ci,deploy}.yml`

Réutilisés : `stripApiPrefix` et `toRequestHandler` (`apps/api/src/request-handler.ts`), module `github-deploy` (rôles via `envs/dev/main.tf`), proxy Vite `/api` (`apps/web/vite.config.ts`), environnement GitHub `dev`.

## Verification (de bout en bout)

1. Chaque tâche : `pnpm lint && pnpm typecheck && pnpm test && pnpm build`, `terraform validate` si infra, `actionlint` si workflow.
2. Intégration API : `firebase emulators:exec` local et job CI `integration`.
3. Navigateur (preview `tech-tcg-web` + emulators) puis site déployé.
4. Simulateur iOS (outil iOS Simulator) pour le mobile.
5. Déploiements : runs « Deploy » verts, `curl` sur `/api/health` et `/api/me`.

## Arrêts prévus

Uniquement : test ou build impossible à faire passer, erreur IAM non résolue par un rôle ciblé, rôle d'administration projet requis (`editor`, `owner`, `iam.*Admin`), décision non couverte par les specs.
