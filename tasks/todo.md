# Tâches : connexion utilisateur

Carte : [CAPABILITY-MAP.md](../CAPABILITY-MAP.md) · Plan : [plan.md](plan.md)

Chaque tâche : tests écrits avant le code quand il y a un comportement, puis `pnpm lint && pnpm typecheck && pnpm test && pnpm build` verts et un commit. Le détail de chaque tâche (fichiers, critères) est dans le plan.

## Phase A : api-deploy ([spec](../SPEC-api-deploy.md))

- [x] A1 : Module Terraform `api-runtime` et rôles de déploiement — vérif : `plan` relu, `apply`, `plan` sans changement
- [x] A2 : Options de la fonction (`serviceAccount`, `invoker`) — vérif : build, emulator Functions
- [x] A3 : Workflow `deploy.yml` (hosting + functions) — vérif : `actionlint`
- [x] A4 : README et SPEC.md
- [ ] Checkpoint A : merge, run « Deploy » vert, `/api/health` = 200 en ligne

## Phase B : auth-core ([spec](../SPEC-auth-core.md))

- [ ] B1 : Schémas du profil dans `shared` — vérif : tests des schémas
- [ ] B2 : Client d'API dans `shared` — vérif : tests avec `fetch` simulé
- [ ] B3 : `buildApp` avec dépendances, plugin d'authentification, `GET` et `PUT /me` — vérif : un test par cas du tableau de la spec
- [ ] B4 : Branchement Firebase Admin réel — vérif : build, emulator Functions
- [ ] B5 : Tests d'intégration sur emulators, job CI `integration`
- [ ] Checkpoint B : merge, déploiement vert, `/api/me` sans jeton = 401 en ligne

## Phase C : auth-web ([spec](../SPEC-auth-web.md))

- [ ] C1 : Config Firebase web (Terraform, variables GitHub, `.env.development`, `firebase.ts`)
- [ ] C2 : Messages d'erreur Firebase en français dans `shared`
- [ ] C3 : `AuthProvider`, `ApiProvider` et gardes de route
- [ ] C4 : Pages connexion, inscription, mot de passe oublié, accueil
- [ ] C5 : Vérification navigateur sur les emulators
- [ ] Checkpoint C : merge, déploiement vert, inscription et connexion sur le site en ligne

## Phase D : auth-mobile ([spec](../SPEC-auth-mobile.md))

- [ ] D1 : Config Firebase mobile (persistance, emulators, variables)
- [ ] D2 : `AuthProvider` mobile
- [ ] D3 : Écrans `(auth)` et `(app)`
- [ ] D4 : Vérification dans le simulateur iOS
- [ ] Checkpoint D : merge
