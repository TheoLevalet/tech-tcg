# tech-tcg

Monorepo TypeScript du jeu de cartes à collectionner Tech TCG : web, mobile, API, moteur de règles et infrastructure Firebase.

Spécification : [SPEC.md](SPEC.md).

## Structure

| Chemin            | Package            | Rôle                                              |
| ----------------- | ------------------ | ------------------------------------------------- |
| `packages/config` | `@tech-tcg/config` | Presets tsconfig, ESLint, Prettier                |
| `packages/shared` | `@tech-tcg/shared` | Schémas Zod et types partagés                     |
| `packages/engine` | `@tech-tcg/engine` | Règles du jeu, TypeScript pur, sans I/O           |
| `apps/api`        | `@tech-tcg/api`    | Fastify servi par une Cloud Function 2nd gen      |
| `apps/web`        | `@tech-tcg/web`    | SPA Vite + React, déployée sur Firebase Hosting   |
| `apps/mobile`     | `@tech-tcg/mobile` | App Expo (React Native)                           |
| `infra/terraform` | —                  | Projet Firebase, Firestore, Auth, Hosting, budget |

Les packages ne dépendent jamais des apps. `shared` et `engine` n'importent aucun SDK Firebase.

## Prérequis

- Node.js 22.12+ (`.nvmrc`)
- pnpm 12 (`corepack enable`)
- Java 21+ pour les emulators Firestore et Auth
- Terraform 1.9+ pour l'infra

Le CLI Firebase est une devDependency : `pnpm exec firebase`.

## Démarrage

```bash
pnpm install
pnpm --filter @tech-tcg/api build
pnpm emulators
```

Dans un second terminal :

```bash
pnpm dev
```

- Web : http://localhost:5173 (le proxy Vite envoie `/api/*` vers l'emulator Functions)
- API : http://127.0.0.1:5001/demo-tech-tcg/europe-west1/api/health
- UI des emulators : http://127.0.0.1:4000

Le projet `demo-tech-tcg` est un projet de démonstration : les emulators n'accèdent à aucun service réel.

Mobile :

```bash
pnpm --filter @tech-tcg/mobile start
```

## Commandes

```bash
pnpm build          # build de tous les packages
pnpm lint           # ESLint
pnpm typecheck      # tsc
pnpm test           # Vitest / Jest
pnpm format         # Prettier
pnpm --filter @tech-tcg/engine test -- --coverage
```

## API et déploiement

`apps/api` est bundlée par tsup dans `apps/api/dist`, avec les packages `@tech-tcg/*` inclus et un `package.json` de déploiement généré. C'est ce dossier que `firebase.json` désigne comme source des functions.

`firebase-functions` est aussi installé à la racine : le CLI Firebase y cherche son binaire.

## Déploiement continu

Le web (`apps/web`) et l'API (`apps/api`) sont déployés sur Firebase Hosting et Cloud Functions à chaque push sur `main` par `.github/workflows/deploy.yml`, ou à la demande depuis l'onglet Actions. Site : https://tech-tcg-dev.web.app, API : https://tech-tcg-dev.web.app/api.

- **Authentification** : fédération d'identité GCP, sans clé ni secret. Seuls ce repo et la ref `refs/heads/main` obtiennent un jeton, qui sert à agir en tant que `github-deployer@tech-tcg-dev.iam.gserviceaccount.com`.
- **Variables** : environnement GitHub `dev` (limité à `main`) avec `GCP_PROJECT_ID`, `GCP_WORKLOAD_IDENTITY_PROVIDER` et `GCP_SERVICE_ACCOUNT`, issues des sorties Terraform.
- **Droits** : liste `roles` du module `github_deploy` dans `infra/terraform/envs/dev/main.tf`, plus le module `api_runtime` (compte d'exécution `api-runtime`, droits de build, dépôt d'images avec nettoyage automatique). En cas d'erreur `403` dans les logs du workflow, ajouter le rôle manquant puis `terraform apply`.
- **Jamais `--force`** : `firebase deploy --force` supprime sans confirmation les fonctions absentes du code.

## Infrastructure

Premier déploiement de `infra/terraform/envs/dev` :

1. Copier `terraform.tfvars.example` en `terraform.tfvars` et renseigner le compte de facturation.
2. Créer `backend_override.tf` contenant `terraform { backend "local" {} }`, puis `terraform init` et `terraform apply` avec un state local.
3. Supprimer `backend_override.tf`, copier `backend.hcl.example` en `backend.hcl`, puis `terraform init -backend-config=backend.hcl -migrate-state`.

Ensuite :

```bash
terraform -chdir=infra/terraform/envs/dev init -backend-config=backend.hcl
terraform -chdir=infra/terraform/envs/dev plan
```

Le plan Blaze est requis pour Cloud Functions. Une alerte budget (5 € par défaut) est créée avec le projet.
