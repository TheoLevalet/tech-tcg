# Spec : auth-web

Module de [CAPABILITY-MAP.md](CAPABILITY-MAP.md). Conventions générales : [SPEC.md](SPEC.md). Dépend de `auth-core`.

## Objectif

Un visiteur du site peut créer un compte, se connecter (email et mot de passe, ou Google), réinitialiser son mot de passe, accéder à une page privée et se déconnecter.

## Parcours

| Route                  | Accès        | Contenu                                                                                      |
| ---------------------- | ------------ | -------------------------------------------------------------------------------------------- |
| `/`                    | Tous         | Redirige vers `/accueil` si connecté, sinon vers `/connexion`                                |
| `/connexion`           | Non connecté | Email, mot de passe, « Se connecter », « Continuer avec Google », liens inscription et oubli |
| `/inscription`         | Non connecté | Pseudo, email, mot de passe, confirmation                                                    |
| `/mot-de-passe-oublie` | Non connecté | Email, envoi du lien de réinitialisation                                                     |
| `/accueil`             | Connecté     | « Bonjour {pseudo} », email, bouton « Se déconnecter »                                       |

- Un visiteur non connecté qui ouvre `/accueil` est redirigé vers `/connexion`, puis ramené sur `/accueil` après connexion.
- Un utilisateur connecté qui ouvre `/connexion` ou `/inscription` est redirigé vers `/accueil`.
- **Inscription** : création du compte Firebase, puis `PUT /api/me` avec le pseudo, puis `/accueil`.
- **Compte sans profil** (Google la première fois, ou échec de `PUT /api/me`) : `/accueil` affiche un formulaire de pseudo, prérempli avec le nom Google le cas échéant, avant le reste.
- **Mot de passe oublié** : message identique que l'email existe ou non (« Si un compte existe, un email a été envoyé »).
- **Déconnexion** : retour à `/connexion`.
- **Session** : conservée après fermeture du navigateur (persistance locale de Firebase Auth).
- **Erreurs** : messages en français, sans révéler si un email est inscrit à la connexion (« Email ou mot de passe incorrect »).
- Mot de passe : 8 caractères minimum, vérifié côté client avant l'appel à Firebase.

## Tech Stack

Ajouts : `firebase` (SDK client, modules `app` et `auth`). Pas de bibliothèque de formulaires ni d'UI : React et CSS simples.

Configuration par variables Vite :

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
VITE_USE_EMULATORS        # "true" en local : Auth sur 127.0.0.1:9099
```

En local, `.env.development` versionné pointe vers le projet `demo-tech-tcg` et les emulators. En CI, les valeurs de `tech-tcg-dev` (publiques par conception) sont des variables de l'environnement GitHub `dev`, issues de Terraform.

## Commands

```bash
pnpm emulators                                 # auth, firestore, functions, hosting
pnpm dev
pnpm --filter @tech-tcg/web test
pnpm --filter @tech-tcg/web build
```

## Project Structure

```
apps/web/src/firebase.ts               → initialisation, connexion aux emulators en local
apps/web/src/auth/AuthProvider.tsx     → contexte : utilisateur courant, état de chargement
apps/web/src/auth/RequireAuth.tsx      → garde de route
apps/web/src/auth/errors.ts            → codes Firebase → messages français
apps/web/src/pages/                    → Connexion, Inscription, MotDePasseOublie, Accueil
apps/web/test/                         → tests par page et par garde
.env.development                       → config demo + emulators
```

## Code Style

Celui de [SPEC.md](SPEC.md). Les pages ne parlent à Firebase qu'à travers `AuthProvider` et au backend qu'à travers le client de `shared` ; les tests remplacent ces deux dépendances.

## Testing Strategy

| Niveau     | Outil                        | Cible                                                                  |
| ---------- | ---------------------------- | ---------------------------------------------------------------------- |
| Unitaire   | Vitest                       | `errors.ts` : chaque code Firebase connu, code inconnu                 |
| Composants | Vitest + Testing Library     | Chaque page : validation, appel attendu, message d'erreur, redirection |
| Garde      | Vitest + Testing Library     | Redirections connecté / non connecté, retour après connexion           |
| Manuel     | Navigateur sur les emulators | Inscription, déconnexion, connexion, oubli, compte sans profil         |
| Manuel     | Site déployé                 | Inscription email et connexion Google sur `tech-tcg-dev.web.app`       |

## Boundaries

**Toujours**

- Aucune page privée rendue avant que l'état d'authentification soit connu (pas de flash de contenu).
- Champs avec `label`, navigation au clavier, `autocomplete` adaptés (`email`, `current-password`, `new-password`).

**Demander d'abord**

- Ajouter une bibliothèque d'UI ou de formulaires.

**Jamais**

- Stocker le mot de passe ou le jeton dans `localStorage` à la main.
- Afficher le message d'erreur brut de Firebase.

## Success Criteria

1. Tous les parcours du tableau fonctionnent sur les emulators, vérifiés dans le navigateur.
2. Sur `https://tech-tcg-dev.web.app` : inscription par email, déconnexion, reconnexion, et connexion Google fonctionnent.
3. Le document `users/{uid}` existe dans Firestore après inscription.
4. Tests verts, couverture des pages et de la garde.

## Open Questions

1. Activation de Google dans la console Firebase : étape manuelle, à faire avant de vérifier le critère 2.
2. Domaines autorisés de Firebase Auth : `localhost`, `tech-tcg-dev.web.app` et `tech-tcg-dev.firebaseapp.com` sont déjà déclarés par Terraform.
