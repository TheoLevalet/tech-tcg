# Spec : auth-core

Module de [CAPABILITY-MAP.md](CAPABILITY-MAP.md). Conventions générales : [SPEC.md](SPEC.md). Dépend de `api-deploy`.

## Objectif

Donner à l'API la notion d'utilisateur connecté et de profil, utilisée ensuite par le web et le mobile :

- l'API reconnaît un utilisateur à partir de son jeton d'identité Firebase ;
- elle lit et écrit son profil `users/{uid}` dans Firestore ;
- `shared` fournit les schémas et un client d'API commun au web et au mobile.

## Comportement attendu

| Requête                       | Cas                               | Réponse                             |
| ----------------------------- | --------------------------------- | ----------------------------------- |
| `GET /me`                     | Jeton absent, mal formé ou expiré | `401 {"error":"unauthenticated"}`   |
| `GET /me`                     | Jeton valide, profil inexistant   | `404 {"error":"profile_not_found"}` |
| `GET /me`                     | Jeton valide, profil existant     | `200` profil                        |
| `PUT /me` `{ "pseudo": "…" }` | Jeton valide, pseudo valide       | `200` profil créé ou mis à jour     |
| `PUT /me`                     | Pseudo invalide ou champ inconnu  | `400 {"error":"invalid_request"}`   |

- Jeton : en-tête `Authorization: Bearer <idToken>`, vérifié par `firebase-admin` (`verifyIdToken`).
- Profil renvoyé : `{ "uid", "email", "pseudo", "createdAt" }`, `createdAt` en ISO 8601. `email` vient du jeton, il n'est pas stocké.
- `createdAt` est fixé à la création et jamais modifié.
- Pseudo : chaîne nettoyée des espaces en bord, 3 à 20 caractères, lettres, chiffres, `_`, `-`. Non unique.
- Règles Firestore : inchangées (« deny all »). Seule l'API, via le SDK Admin, accède à `users`.

## Tech Stack

Ajouts : `firebase-admin` (déjà dépendance de `apps/api`), plugin Fastify maison pour l'authentification. Aucune nouvelle dépendance dans `shared`.

## Commands

```bash
pnpm --filter @tech-tcg/api test                      # unitaires, sans emulator
pnpm --filter @tech-tcg/api test:integration          # avec emulators Auth et Firestore
pnpm exec firebase emulators:exec --only auth,firestore "pnpm --filter @tech-tcg/api test:integration"
```

## Project Structure

```
packages/shared/src/profile.ts            → userProfileSchema, updateProfileRequestSchema, pseudoSchema
packages/shared/src/api-client.ts         → createApiClient({ baseUrl, getIdToken }) : getMe, updateMe, health
apps/api/src/auth.ts                      → plugin authenticate : request.user = { uid, email }
apps/api/src/profiles.ts                  → interface ProfileStore + implémentation Firestore
apps/api/src/routes/me.ts                 → GET et PUT /me
apps/api/src/app.ts                       → buildApp({ verifyIdToken, profiles })
apps/api/test/me.test.ts                  → unitaires avec vérificateur et store en mémoire
apps/api/test/integration/me.test.ts      → emulators Auth et Firestore
```

## Code Style

Dépendances injectées dans `buildApp` : les tests unitaires n'ont besoin ni de Firebase ni d'emulator.

```ts
export interface AppDependencies {
  verifyIdToken: (token: string) => Promise<{ uid: string; email?: string }>;
  profiles: ProfileStore;
}

export function buildApp(
  deps: AppDependencies,
  options: FastifyServerOptions = {},
): FastifyInstance {
  const app = Fastify(options);
  app.register(healthRoutes);
  app.register(meRoutes, deps);
  return app;
}
```

## Testing Strategy

| Niveau      | Où                          | Outil                                 | Cible                                                      |
| ----------- | --------------------------- | ------------------------------------- | ---------------------------------------------------------- |
| Unitaire    | `packages/shared/test`      | Vitest                                | Schémas : pseudo limite, caractères interdits, espaces     |
| Unitaire    | `packages/shared/test`      | Vitest + `fetch` simulé               | Client d'API : en-tête `Authorization`, erreurs typées     |
| API         | `apps/api/test/me.test.ts`  | Vitest + `inject()`, store en mémoire | Chaque ligne du tableau « Comportement attendu »           |
| Intégration | `apps/api/test/integration` | Vitest + emulators Auth et Firestore  | Vrai jeton émis par l'emulator, document lu dans Firestore |

La CI lance les tests d'intégration avec `firebase emulators:exec` (Java est présent sur les runners Ubuntu).

## Boundaries

**Toujours**

- Valider entrée et sortie avec les schémas de `shared`.
- Ne jamais renvoyer le détail d'une erreur de vérification de jeton au client.

**Demander d'abord**

- Ouvrir un accès direct à Firestore depuis un client (règles).
- Stocker une donnée personnelle supplémentaire dans le profil.

**Jamais**

- Journaliser un jeton d'identité.
- Faire confiance à un `uid` venant du corps de la requête.

## Success Criteria

1. Tous les cas du tableau sont couverts par des tests unitaires verts.
2. Le test d'intégration crée un utilisateur dans l'emulator Auth, appelle `PUT /me` puis `GET /me`, et retrouve le document dans l'emulator Firestore.
3. Après déploiement, `GET https://tech-tcg-dev.web.app/api/me` sans jeton renvoie `401`.

## Open Questions

Aucune.
