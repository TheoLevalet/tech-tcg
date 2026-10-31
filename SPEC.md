# Spec : initialisation du monorepo tech-tcg

## Objectif

Poser le socle technique de **tech-tcg** (jeu de cartes à collectionner) : un monorepo TypeScript unique contenant web, mobile, API, moteur de jeu et infrastructure.

Périmètre de cette spec : **scaffolding uniquement**. Chaque app démarre avec un « hello world » branché de bout en bout ; aucune fonctionnalité de jeu. Les fonctionnalités feront l'objet de specs par module (`SPEC-<module-id>.md`).

Contrainte transverse : **coût minimal**. Rester dans les quotas gratuits Firebase, scale-to-zero partout, aucune ressource facturée en permanence.

### Hypothèses

1. Node.js 22 LTS partout (runtime `nodejs22` supporté par Cloud Functions 2nd gen).
2. Firebase sur plan **Blaze** (requis pour Cloud Functions), avec alerte budget à quelques euros ; usage réel couvert par le free tier.
3. Firestore = base de données, Firebase Auth = identité, Firebase Hosting = front web.
4. API Fastify déployée comme **une seule** Cloud Function 2nd gen HTTP (`onRequest`), `minInstances: 0`.
5. Région `europe-west1`.
6. Un seul environnement au démarrage (`dev`) ; `prod` ajouté plus tard via workspace / dossier Terraform dédié.
7. GitHub Actions pour la CI (lint, typecheck, test, build) et le déploiement continu du web et de l'API (voir « Déploiement continu »).

## Carte des modules

| Module id | Chemin            | Responsabilité                                                      | Dépend de          |
| --------- | ----------------- | ------------------------------------------------------------------- | ------------------ |
| `config`  | `packages/config` | Presets partagés : tsconfig, ESLint, Prettier                       | —                  |
| `shared`  | `packages/shared` | Types et schémas Zod partagés (DTO API, modèles Firestore)          | `config`           |
| `engine`  | `packages/engine` | Règles du TCG, pur TS, sans I/O, déterministe                       | `config`, `shared` |
| `api`     | `apps/api`        | Fastify sur Cloud Functions, Firestore, vérif. tokens Firebase Auth | `shared`, `engine` |
| `web`     | `apps/web`        | SPA Vite + React, Firebase Hosting                                  | `shared`, `engine` |
| `mobile`  | `apps/mobile`     | Expo (React Native)                                                 | `shared`, `engine` |
| `infra`   | `infra/terraform` | Projet Firebase, Firestore, Auth, Hosting, budget                   | —                  |

Ordre de construction : `config` → `shared` → `engine` → `api`, `web`, `mobile` (parallélisables) ; `infra` indépendant.

Règle : les dépendances vont uniquement vers le bas. `engine` et `shared` n'importent jamais une app ni un SDK Firebase.

## Tech Stack

| Domaine         | Choix                                                                                           |
| --------------- | ----------------------------------------------------------------------------------------------- |
| Package manager | pnpm 12 (workspaces), `packageManager` épinglé dans `package.json`                              |
| Orchestration   | Turborepo 2                                                                                     |
| Langage         | TypeScript 6.0 (typescript-eslint ne supporte pas encore la 7), `strict: true`, ESM partout     |
| Front web       | Vite 8 + React 19.3 + React Router                                                              |
| Mobile          | Expo SDK 58 (impose la version de React du monorepo) + Expo Router                              |
| API             | Fastify 5 dans `firebase-functions` v2 `onRequest`                                              |
| Validation      | Zod                                                                                             |
| Données         | Firestore (`firebase-admin` côté API, SDK client côté web/mobile)                               |
| Auth            | Firebase Auth                                                                                   |
| IaC             | Terraform ≥ 1.9, providers `google` + `google-beta` 8.x                                         |
| Lint / format   | ESLint 10 (flat config) + Prettier                                                              |
| Tests           | Vitest (packages, api, web), Jest + `jest-expo` (mobile), Firebase Emulator Suite (intégration) |
| CI              | GitHub Actions                                                                                  |

## Commands

Depuis la racine :

```bash
pnpm install                      # installe tout le workspace
pnpm dev                          # turbo run dev (web + api + emulators)
pnpm build                        # turbo run build
pnpm lint                         # turbo run lint
pnpm format                       # prettier --write .
pnpm typecheck                    # turbo run typecheck
pnpm test                         # turbo run test
pnpm test -- --coverage           # avec couverture
pnpm --filter @tech-tcg/web dev   # une seule app
pnpm emulators                    # firebase emulators:start (auth, firestore, functions, hosting)
```

Infra :

```bash
terraform -chdir=infra/terraform/envs/dev init
terraform -chdir=infra/terraform/envs/dev plan
terraform -chdir=infra/terraform/envs/dev apply
```

Mobile :

```bash
pnpm --filter @tech-tcg/mobile start   # expo start
```

## Project Structure

```
tech-tcg/
├── apps/
│   ├── api/              → Fastify + entrée Cloud Function (src/index.ts exporte la function)
│   │   ├── src/
│   │   └── test/
│   ├── web/              → Vite + React
│   │   ├── src/
│   │   └── test/
│   └── mobile/           → Expo
│       ├── app/          → routes Expo Router
│       └── src/
├── packages/
│   ├── config/           → tsconfig.base.json, eslint.config.js, prettier.config.js
│   ├── shared/           → schémas Zod + types inférés
│   └── engine/           → moteur de règles
│       ├── src/
│       └── test/
├── infra/
│   └── terraform/
│       ├── modules/firebase/   → module réutilisable
│       └── envs/dev/           → instanciation dev
├── .github/workflows/ci.yml
├── firebase.json         → config emulators + hosting + functions
├── .firebaserc
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── .nvmrc                → 22
├── SPEC.md
└── README.md
```

Nommage des packages : `@tech-tcg/<module-id>`.

## Code Style

- ESM, imports explicites, pas de `default export` sauf là où un framework l'exige (routes Expo, config Vite).
- Fichiers en `kebab-case.ts`, composants React en `PascalCase.tsx`.
- Types dérivés des schémas Zod (`z.infer`), jamais dupliqués à la main.
- `engine` : fonctions pures, état immuable, aléatoire injecté (seed) pour rester déterministe.
- Pas de `any` ; `unknown` + parsing Zod aux frontières (requêtes HTTP, documents Firestore).

```ts
// packages/shared/src/card.ts
import { z } from "zod";

export const cardSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  cost: z.number().int().nonnegative(),
});

export type Card = z.infer<typeof cardSchema>;
```

```ts
// packages/engine/src/draw.ts
import type { Card } from "@tech-tcg/shared";

export interface DrawResult {
  hand: readonly Card[];
  deck: readonly Card[];
}

export function draw(deck: readonly Card[], hand: readonly Card[], count: number): DrawResult {
  const drawn = deck.slice(0, count);
  return { hand: [...hand, ...drawn], deck: deck.slice(drawn.length) };
}
```

## Testing Strategy

| Niveau         | Où                                             | Outil                                        | Cible                                   |
| -------------- | ---------------------------------------------- | -------------------------------------------- | --------------------------------------- |
| Unitaire       | `packages/engine/test`, `packages/shared/test` | Vitest                                       | Couverture engine ≥ 90 %                |
| API            | `apps/api/test`                                | Vitest + `fastify.inject()`                  | Chaque route : cas nominal + validation |
| Intégration    | `apps/api/test/integration`                    | Vitest + Firestore/Auth emulators            | Lecture/écriture Firestore réelles      |
| Composants web | `apps/web/test`                                | Vitest + Testing Library                     | Composants avec logique                 |
| Mobile         | `apps/mobile`                                  | Jest + `jest-expo`                           | Smoke test de rendu                     |
| Infra          | `infra/terraform`                              | `terraform fmt -check`, `terraform validate` | CI                                      |

Aucun test ne touche un vrai projet Firebase ; tout passe par les emulators.

## Boundaries

**Toujours**

- `pnpm lint && pnpm typecheck && pnpm test` verts avant chaque commit.
- Valider toute entrée externe avec Zod.
- Garder `engine` et `shared` sans dépendance Firebase ni I/O.
- Ressources cloud en scale-to-zero, dans le free tier.

**Demander d'abord**

- Ajouter une dépendance (hors stack listée ci-dessus).
- `terraform apply`, toute commande `firebase deploy`.
- Activer une API GCP ou une ressource potentiellement facturée.
- Modifier la CI, les presets de `packages/config`, ou le schéma des collections Firestore.

**Jamais**

- Committer secrets, clés de service account, `.env`, `terraform.tfstate`.
- Désactiver une règle lint / un test pour passer au vert sans accord.
- Importer une app depuis un package.
- Ouvrir les règles Firestore en lecture/écriture publique.

## Success Criteria

1. `pnpm install` puis `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test` passent depuis un clone propre.
2. `engine` exporte `draw()` testé ; `api`, `web` et `mobile` l'importent et compilent.
3. `pnpm emulators` + `pnpm dev` : `GET /health` sur l'API locale répond `200 {"status":"ok"}` ; la page web l'affiche.
4. `pnpm --filter @tech-tcg/mobile start` lance Expo sans erreur et affiche un écran utilisant `@tech-tcg/shared`.
5. `terraform validate` passe sur `envs/dev` ; le plan crée projet Firebase, Firestore (mode natif), Auth, site Hosting, alerte budget.
6. Turbo met en cache `build`, `lint`, `test` (2e exécution « FULL TURBO »).
7. CI GitHub Actions verte sur la PR d'init.

## Déploiement continu

Périmètre : Firebase Hosting (`apps/web`) et Cloud Functions (`apps/api`, voir [SPEC-api-deploy.md](SPEC-api-deploy.md)). Règles Firestore et mobile hors périmètre.

- Déclencheur : push sur `main` et `workflow_dispatch`, environnement GitHub `dev` limité à `main`.
- Authentification : Workload Identity Federation, sans clé de compte de service. Le pool n'accepte que le repo `TheoLevalet/tech-tcg` (par identifiant de repo) et la ref `refs/heads/main`.
- Compte de service `github-deployer` aux droits minimaux pour `firebase deploy --only hosting,functions`. La fonction s'exécute sous `api-runtime`.
- Variables GitHub (non secrètes) dans l'environnement `dev` : `GCP_PROJECT_ID`, `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_SERVICE_ACCOUNT`.
- Ressources GCP gérées par Terraform, state dans `gs://tech-tcg-dev-tfstate`. `terraform apply` reste manuel.

Critères de succès :

1. Un push sur `main` déploie `apps/web/dist` sur `https://tech-tcg-dev.web.app`.
2. Aucun secret GitHub n'est nécessaire.
3. Un workflow lancé depuis une autre branche ou un fork ne peut pas obtenir de jeton GCP.

## Open Questions

1. **Plan Blaze** : OK pour l'activer (carte requise, alerte budget à fixer — 5 € ?) ? Sans Blaze → pas de Cloud Functions, l'API devrait passer ailleurs ou être remplacée par Firestore + règles de sécurité côté client.
2. **Projet GCP/Firebase** : existant ou créé par Terraform ? Si créé, il faut un billing account et un dossier/organisation.
3. **State Terraform** : bucket GCS (quasi gratuit) ou local au démarrage ?
4. **Temps réel des parties** : Firestore listeners (gratuit dans les quotas, recommandé) plutôt que WebSocket — Cloud Functions ne tient pas de connexions longues. À confirmer pour les specs suivantes.
5. **Node 22 vs 24** : rester sur 22 tant que le runtime Cloud Functions 24 n'est pas GA ?
