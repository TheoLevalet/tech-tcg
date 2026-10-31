# Spec : auth-mobile

Module de [CAPABILITY-MAP.md](CAPABILITY-MAP.md). Conventions générales : [SPEC.md](SPEC.md). Dépend de `auth-core`. Même parcours que [SPEC-auth-web.md](SPEC-auth-web.md), sans Google (module `auth-mobile-google`).

## Objectif

Dans l'app Expo, un utilisateur peut créer un compte, se connecter par email et mot de passe, réinitialiser son mot de passe, voir un écran privé et se déconnecter. Un compte créé sur le web fonctionne sur le mobile, et inversement.

## Parcours

| Écran (Expo Router)          | Accès        | Contenu                                         |
| ---------------------------- | ------------ | ----------------------------------------------- |
| `(auth)/connexion`           | Non connecté | Email, mot de passe, liens inscription et oubli |
| `(auth)/inscription`         | Non connecté | Pseudo, email, mot de passe, confirmation       |
| `(auth)/mot-de-passe-oublie` | Non connecté | Email, envoi du lien                            |
| `(app)/accueil`              | Connecté     | « Bonjour {pseudo} », email, « Se déconnecter » |

- Règles identiques au web : redirections, compte sans profil, messages d'erreur, longueur du mot de passe.
- La session survit à la fermeture de l'app (persistance Firebase Auth sur AsyncStorage).
- Claviers adaptés (`email-address`, `secureTextEntry`) et `textContentType` pour le remplissage automatique iOS.

## Tech Stack

Ajouts : `firebase` (SDK JS, `initializeAuth` + `getReactNativePersistence`), `@react-native-async-storage/async-storage` (version imposée par Expo SDK 58).

Configuration par variables Expo :

```
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_APP_ID
EXPO_PUBLIC_API_URL            # https://tech-tcg-dev.web.app/api, ou l'emulator Functions en local
EXPO_PUBLIC_USE_EMULATORS
```

En local, l'hôte des emulators est celui de Metro (`Constants.expoConfig.hostUri`) : le simulateur iOS et un téléphone sur le même réseau y accèdent sans configuration.

## Commands

```bash
pnpm emulators
pnpm --filter @tech-tcg/mobile start
pnpm --filter @tech-tcg/mobile test
```

## Project Structure

```
apps/mobile/src/firebase.ts             → initialisation, persistance, emulators
apps/mobile/src/auth/AuthProvider.tsx   → même contrat que le web
apps/mobile/app/(auth)/                 → connexion, inscription, mot-de-passe-oublie, _layout (redirige si connecté)
apps/mobile/app/(app)/                  → accueil, _layout (redirige si non connecté)
apps/mobile/test/                       → tests des écrans
```

La correspondance code Firebase → message français est dans `shared` (`authErrorMessage`), commune aux deux apps.

## Code Style

Celui de [SPEC.md](SPEC.md). Mêmes séparations que sur le web : écrans → `AuthProvider` → Firebase, écrans → client de `shared` → API.

## Testing Strategy

| Niveau | Outil                               | Cible                                                        |
| ------ | ----------------------------------- | ------------------------------------------------------------ |
| Écrans | Jest + Testing Library React Native | Validation, appel attendu, message d'erreur, redirection     |
| Manuel | Simulateur iOS sur les emulators    | Inscription, déconnexion, connexion, oubli, relance de l'app |
| Manuel | Simulateur iOS sur `tech-tcg-dev`   | Connexion avec un compte créé sur le web                     |

## Boundaries

**Toujours**

- Même contrat d'`AuthProvider` que le web.

**Demander d'abord**

- Tout module natif nécessitant un build de développement (hors Expo Go).

**Jamais**

- Stocker le mot de passe sur l'appareil.

## Success Criteria

1. Tous les parcours fonctionnent dans le simulateur iOS sur les emulators.
2. Un compte créé sur le web se connecte sur le mobile contre `tech-tcg-dev`.
3. Après fermeture et relance de l'app, l'utilisateur est toujours connecté.
4. Tests verts.

## Open Questions

1. Android non vérifié dans ce module (pas d'émulateur Android prévu) : à confirmer si nécessaire.
