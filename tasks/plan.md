# Plan d'implémentation : initialisation du monorepo tech-tcg

## Vue d'ensemble

Mise en œuvre de [SPEC.md](../SPEC.md) : socle pnpm + Turborepo avec `config`, `shared`, `engine`, `api` (Fastify sur Cloud Functions), `web` (Vite + React), `mobile` (Expo), `infra` (Terraform Firebase) et CI. Aucune fonctionnalité de jeu : chaque app prouve qu'elle compile, se teste et consomme les packages partagés.

Tâches détaillées : [todo.md](todo.md).

## Graphe de dépendances

```
racine workspace (T1)
    │
    └── config (T2)
            │
            └── shared (T3)
                    │
                    ├── engine (T4)
                    │       │
                    │       ├── api : Fastify /health (T5)
                    │       │       │
                    │       │       └── api sur Cloud Functions + emulators (T6)
                    │       │               │
                    │       │               └── web : affiche /health (T7)
                    │       │
                    │       └── mobile : Expo affiche draw() (T8)
                    │
infra (T9 → T10)   ← indépendant du code TS
CI (T11)           ← après T1-T10
README (T12)
```

## Décisions d'architecture

- **Questions ouvertes de la spec, réponses par défaut retenues** (à infirmer avant T6/T9) :
  plan Blaze + alerte budget 5 €, projet Firebase créé par Terraform, state Terraform dans un bucket GCS, temps réel futur via listeners Firestore, Node 22.
- **Packages internes consommés en source TS** (`exports` → `src/index.ts`) pour web, mobile et tests : pas d'étape de build intermédiaire, HMR direct. `tsc --noEmit` pour le typecheck.
- **API bundlée avec tsup** (`noExternal: [/^@tech-tcg\//]`) vers `apps/api/dist` avec un `package.json` de déploiement généré : `firebase deploy` ne sait pas résoudre `workspace:*`.
- **App Fastify séparée de l'adaptateur Cloud Functions** : `buildApp()` testable via `inject()` sans Firebase ; `src/index.ts` ne fait que l'adaptation `onRequest`.
- **Schéma de réponse `/health` dans `shared`** : contrat unique API ↔ web.
- **Règles Firestore « deny all »** dès T6 ; ouvertes collection par collection dans les specs futures.
- **Terraform en deux couches** : `modules/firebase` (réutilisable) + `envs/dev` (instanciation). Bootstrap du bucket de state documenté (état local pour la toute première création).

## Liste des tâches

### Phase 1 : Fondations

- [x] T1 : Racine du workspace pnpm + Turborepo
- [x] T2 : Presets partagés `@tech-tcg/config`
- [x] T3 : `@tech-tcg/shared` avec `cardSchema` et `healthResponseSchema`
- [x] T4 : `@tech-tcg/engine` avec `draw()`

### Checkpoint 1 : Fondations

- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` verts
- [ ] 2e exécution « FULL TURBO »
- [ ] Revue humaine

### Phase 2 : Apps (tranches verticales)

- [x] T5 : API Fastify `GET /health` testée par `inject()`
- [x] T6 : API servie par Cloud Functions dans les emulators
- [x] T7 : Web Vite + React affichant le statut de l'API
- [x] T8 : Mobile Expo utilisant `engine` et `shared`

### Checkpoint 2 : Apps

- [ ] `pnpm emulators` + `pnpm dev` → page web affiche `ok`
- [ ] Expo démarre sans erreur
- [ ] Revue humaine

### Phase 3 : Infra, CI, docs

- [x] T9 : Terraform : bucket de state + projet Firebase
- [x] T10 : Terraform : Firestore, Auth, Hosting, budget
- [x] T11 : CI GitHub Actions
- [x] T12 : README

### Checkpoint final

- [ ] Tous les critères de succès de SPEC.md remplis
- [ ] CI verte sur la PR d'init
- [ ] Prêt pour revue

### Phase 4 : Déploiement continu Hosting

Branche `feat/deploy-hosting`, PR empilée sur `chore/init-monorepo` (rebasculée sur `main` après merge de la #1).

- [x] T13 : Terraform : fédération d'identité GitHub et compte `github-deployer`
- [ ] T14 : `terraform apply` de T13 (accordé avec ce plan)
- [ ] T15 : Environnement GitHub `dev` et ses variables
- [ ] T16 : Workflow `deploy-hosting.yml`
- [ ] T17 : README

### Checkpoint 4 : Déploiement

- [ ] CI verte sur la PR
- [ ] Après merge sur `main` : déploiement vert, `https://tech-tcg-dev.web.app` sert le web

## Risques et mitigations

| Risque                                                            | Impact | Mitigation                                                                                                          |
| ----------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------- |
| Fastify dans `onRequest` : le body est déjà parsé par Functions   | Moyen  | Passer `req.rawBody` / désactiver le parser JSON de Fastify dans l'adaptateur ; test POST dans T6                   |
| `firebase deploy` ne résout pas `workspace:*`                     | Haut   | Bundle tsup + `package.json` généré (T6), vérifié par `firebase emulators` sur `dist/`                              |
| Expo + pnpm (symlinks, Metro)                                     | Moyen  | Expo SDK récent gère les installs isolées ; repli `node-linker=hoisted` limité au besoin, à valider en T8           |
| Expo épingle ses propres versions de React/TS                     | Moyen  | `pnpm.overrides` ou versions alignées sur celles d'Expo pour tout le monorepo                                       |
| Terraform Firebase nécessite `google-beta` et un billing account  | Moyen  | Variables `billing_account` / `org_id` ; `plan` uniquement, `apply` sur accord                                      |
| Firebase Auth via Terraform passe par Identity Platform           | Bas    | Rester sous 50k MAU (free tier) ; documenté dans le module                                                          |
| Rewrite `/api/**` vers une function non déployée                  | Bas    | Le CLI émet un avertissement sans échouer ; la page affiche « API : injoignable » tant que l'API n'est pas déployée |
| Droits IAM insuffisants pour `firebase deploy`                    | Moyen  | Rôles ajustés au premier échec, sans élargir au-delà de Hosting                                                     |
| Workflow non testable avant merge (environnement limité à `main`) | Moyen  | `actionlint` en local ; premier run réel au merge, corrigé dans une PR de suivi si besoin                           |
| Facturation surprise                                              | Haut   | Budget + alerte dès T10, `minInstances: 0`, `maxInstances` bas                                                      |

## Parallélisation

- Après T4 : T5→T6→T7 (chaîne API/web) et T8 (mobile) indépendants.
- T9→T10 indépendants de tout le code TS, peuvent démarrer dès T1.
- T11 en dernier (dépend des commandes de toutes les apps).

## Questions ouvertes

Reprises de SPEC.md, réponses par défaut appliquées ci-dessus tant que non tranchées :

1. Plan Blaze et montant de l'alerte budget.
2. Projet Firebase existant ou créé par Terraform (billing account / organisation).
3. State Terraform GCS ou local.
