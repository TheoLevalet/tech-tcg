# Tâches : initialisation du monorepo tech-tcg

Spec : [SPEC.md](../SPEC.md) · Plan : [plan.md](plan.md)

## Phase 1 : Fondations

## T1 : Racine du workspace pnpm + Turborepo

**Description :** Créer le squelette racine : workspaces pnpm, pipeline Turbo (`build`, `dev`, `lint`, `typecheck`, `test`), version Node épinglée, ignore files.

**Critères d'acceptation :**

- [ ] `pnpm install` passe sur un clone propre
- [ ] `pnpm build|lint|typecheck|test` lancent `turbo run <task>` sans erreur (0 package)
- [ ] `.gitignore` couvre `node_modules`, `dist`, `.turbo`, `.env*`, `*.tfstate*`, `.terraform/`

**Vérification :**

- [ ] `pnpm install && pnpm build`
- [ ] `node -v` correspond à `.nvmrc`

**Dépendances :** aucune

**Fichiers :** `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.nvmrc`, `.npmrc`, `.gitignore`

**Taille :** S

## T2 : Presets partagés `@tech-tcg/config`

**Description :** `tsconfig.base.json` (strict, ESM, `moduleResolution: bundler`), config ESLint 9 flat (TS + règles React optionnelles), config Prettier. Racine branchée dessus.

**Critères d'acceptation :**

- [ ] Un package peut étendre `@tech-tcg/config/tsconfig.base.json`
- [ ] `eslint.config.js` exporte une config de base et une variante React
- [ ] `pnpm format --check` passe à la racine

**Vérification :**

- [ ] `pnpm lint && pnpm exec prettier --check .`

**Dépendances :** T1

**Fichiers :** `packages/config/package.json`, `packages/config/tsconfig.base.json`, `packages/config/eslint.config.js`, `packages/config/prettier.config.js`, `prettier.config.js`

**Taille :** M

## T3 : `@tech-tcg/shared` avec `cardSchema` et `healthResponseSchema`

**Description :** Package de schémas Zod + types inférés. `cardSchema` (exemple de SPEC.md) et `healthResponseSchema` (`{ status: "ok" }`), contrat de `/health`.

**Critères d'acceptation :**

- [ ] `import { cardSchema, type Card } from "@tech-tcg/shared"` fonctionne depuis un autre package
- [ ] Tests Vitest : parse valide, rejet `cost` négatif, rejet `status` inconnu
- [ ] Aucune dépendance hors `zod`

**Vérification :**

- [ ] `pnpm --filter @tech-tcg/shared test`
- [ ] `pnpm --filter @tech-tcg/shared typecheck`

**Dépendances :** T2

**Fichiers :** `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/src/index.ts`, `packages/shared/src/card.ts`, `packages/shared/src/health.ts`, `packages/shared/test/card.test.ts`

**Taille :** M

## T4 : `@tech-tcg/engine` avec `draw()`

**Description :** Moteur de règles pur. Première fonction `draw()` (SPEC.md), immuable. Seuil de couverture 90 % configuré dans Vitest.

**Critères d'acceptation :**

- [ ] `draw()` : pioche nominale, pioche > taille du deck, `count = 0`, entrées non mutées
- [ ] Couverture ≥ 90 %, échec sinon
- [ ] Aucune dépendance Firebase / I/O

**Vérification :**

- [ ] `pnpm --filter @tech-tcg/engine test -- --coverage`

**Dépendances :** T3

**Fichiers :** `packages/engine/package.json`, `packages/engine/tsconfig.json`, `packages/engine/vitest.config.ts`, `packages/engine/src/index.ts`, `packages/engine/src/draw.ts`, `packages/engine/test/draw.test.ts`

**Taille :** M

## Checkpoint 1 : Fondations

- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` verts
- [ ] 2e `pnpm build` → « FULL TURBO »
- [ ] Revue humaine avant la phase 2

## Phase 2 : Apps

## T5 : API Fastify `GET /health` testée par `inject()`

**Description :** `apps/api` avec `buildApp()` Fastify, route `/health` dont la réponse est validée par `healthResponseSchema`. Pas encore de Firebase.

**Critères d'acceptation :**

- [ ] `GET /health` → `200 {"status":"ok"}`
- [ ] Route inconnue → `404`
- [ ] Test `inject()` sans serveur réseau

**Vérification :**

- [ ] `pnpm --filter @tech-tcg/api test`

**Dépendances :** T4

**Fichiers :** `apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/src/app.ts`, `apps/api/src/routes/health.ts`, `apps/api/test/health.test.ts`

**Taille :** M

## T6 : API servie par Cloud Functions dans les emulators

**Description :** Adaptateur `onRequest` (2nd gen, `europe-west1`, `minInstances: 0`, `maxInstances` bas), bundle tsup vers `dist/` avec `package.json` de déploiement, `firebase.json` (emulators auth/firestore/functions/hosting), `firestore.rules` deny all, script `pnpm emulators`.

**Critères d'acceptation :**

- [ ] `pnpm emulators` démarre ; `curl` sur l'URL de la function `/health` → `200 {"status":"ok"}`
- [ ] Un POST JSON traverse l'adaptateur sans double parsing
- [ ] `dist/` ne référence aucun `workspace:*`

**Vérification :**

- [ ] `pnpm --filter @tech-tcg/api build && pnpm emulators` puis `curl`
- [ ] `grep workspace apps/api/dist/package.json` vide

**Dépendances :** T5

**Fichiers :** `apps/api/src/index.ts`, `apps/api/tsup.config.ts`, `firebase.json`, `.firebaserc`, `firestore.rules`

**Taille :** M

## T7 : Web Vite + React affichant le statut de l'API

**Description :** `apps/web` Vite + React + React Router. Page d'accueil appelant `/health` (proxy Vite vers l'emulator), parse via `healthResponseSchema`, affiche le statut. `pnpm dev` lance web + build watch api.

**Critères d'acceptation :**

- [ ] Avec emulators lancés, la page affiche `ok` ; sans, un état d'erreur
- [ ] Test Testing Library avec `fetch` mocké (succès + erreur)
- [ ] `pnpm build` produit `apps/web/dist` servi par l'emulator Hosting

**Vérification :**

- [ ] `pnpm --filter @tech-tcg/web test && pnpm --filter @tech-tcg/web build`
- [ ] Manuel : `pnpm emulators` + `pnpm dev`, page affiche `ok`

**Dépendances :** T6

**Fichiers :** `apps/web/package.json`, `apps/web/vite.config.ts`, `apps/web/src/main.tsx`, `apps/web/src/App.tsx`, `apps/web/test/App.test.tsx`

**Taille :** M

## T8 : Mobile Expo utilisant `engine` et `shared`

**Description :** `apps/mobile` Expo + Expo Router, Metro configuré pour le monorepo pnpm. Écran d'accueil affichant le résultat de `draw()` sur un deck exemple typé `Card`.

**Critères d'acceptation :**

- [ ] `pnpm --filter @tech-tcg/mobile start` lance Metro sans erreur de résolution
- [ ] Smoke test `jest-expo` du rendu de l'écran
- [ ] `typecheck` et `lint` passent

**Vérification :**

- [ ] `pnpm --filter @tech-tcg/mobile test && pnpm --filter @tech-tcg/mobile typecheck`
- [ ] Manuel : écran visible dans le simulateur iOS

**Dépendances :** T4

**Fichiers :** `apps/mobile/package.json`, `apps/mobile/app.json`, `apps/mobile/metro.config.js`, `apps/mobile/app/index.tsx`, `apps/mobile/app/__tests__/index.test.tsx`

**Taille :** M

## Checkpoint 2 : Apps

- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` verts
- [ ] `pnpm emulators` + `pnpm dev` → page web affiche `ok`
- [ ] Expo démarre, écran visible
- [ ] Revue humaine avant la phase 3

## Phase 3 : Infra, CI, docs

## T9 : Terraform : bucket de state + projet Firebase

**Description :** `modules/firebase` + `envs/dev`. Providers `google`/`google-beta` épinglés. Projet GCP (variables `billing_account`, `org_id`/`folder_id`), activation Firebase, bucket GCS de state. Procédure de bootstrap (state local → migration GCS) documentée.

**Critères d'acceptation :**

- [ ] `terraform validate` passe sur `envs/dev`
- [ ] Aucune valeur sensible committée ; `terraform.tfvars.example` fourni
- [ ] Backend GCS configuré

**Vérification :**

- [ ] `terraform -chdir=infra/terraform/envs/dev init -backend=false && terraform -chdir=infra/terraform/envs/dev validate`
- [ ] `terraform fmt -check -recursive infra/terraform`

**Dépendances :** T1

**Fichiers :** `infra/terraform/modules/firebase/{main,variables,outputs,versions}.tf`, `infra/terraform/envs/dev/{main,backend,variables}.tf`, `infra/terraform/envs/dev/terraform.tfvars.example`

**Taille :** M

## T10 : Terraform : Firestore, Auth, Hosting, budget

**Description :** Dans `modules/firebase` : base Firestore (mode natif, `europe-west1`), Auth (Identity Platform, email + Google), site Hosting, app web Firebase, budget avec alerte (5 € par défaut).

**Critères d'acceptation :**

- [ ] `terraform validate` passe
- [ ] Budget et seuils d'alerte paramétrables
- [ ] `plan` (sur accord, avec billing account) liste uniquement des ressources free tier / à l'usage

**Vérification :**

- [ ] `terraform -chdir=infra/terraform/envs/dev validate`
- [ ] Manuel, sur accord : `terraform plan`

**Dépendances :** T9

**Fichiers :** `infra/terraform/modules/firebase/{firestore,auth,hosting,budget}.tf`, `infra/terraform/modules/firebase/variables.tf`

**Taille :** M

## T11 : CI GitHub Actions

**Description :** Workflow sur PR et `main` : setup pnpm + Node 22, cache pnpm et Turbo, `lint`, `typecheck`, `test`, `build`, puis `terraform fmt -check` + `validate`.

**Critères d'acceptation :**

- [ ] Workflow vert sur la PR d'init
- [ ] Échec si lint, typecheck, test ou terraform échoue
- [ ] Aucun secret requis

**Vérification :**

- [ ] `gh pr checks` vert

**Dépendances :** T1-T10

**Fichiers :** `.github/workflows/ci.yml`

**Taille :** S

## T12 : README

**Description :** Prérequis (Node 22, pnpm, Firebase CLI, Terraform), commandes de SPEC.md, structure, bootstrap infra.

**Critères d'acceptation :**

- [ ] Un nouveau dev lance l'environnement local en suivant uniquement le README

**Vérification :**

- [ ] Relecture humaine

**Dépendances :** T11

**Fichiers :** `README.md`

**Taille :** XS

## Checkpoint final

- [ ] Les 7 critères de succès de SPEC.md remplis
- [ ] CI verte sur la PR d'init
- [ ] Revue humaine
