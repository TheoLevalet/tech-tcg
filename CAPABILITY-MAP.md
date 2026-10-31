# Carte des modules : connexion

Initiative : un utilisateur peut créer un compte, se connecter et se déconnecter, sur le web et sur le mobile. Conventions générales : [SPEC.md](SPEC.md).

| Module id            | Responsabilité                                                                                     | Dépend de     | Spec                                       |
| -------------------- | -------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------ |
| `api-deploy`         | Déploiement automatique de l'API sur Cloud Functions, compte de service d'exécution, droits IAM    | —             | [SPEC-api-deploy.md](SPEC-api-deploy.md)   |
| `auth-core`          | Schéma du profil, vérification des jetons Firebase par l'API, `GET` et `PUT /api/me`, client d'API | `api-deploy`  | [SPEC-auth-core.md](SPEC-auth-core.md)     |
| `auth-web`           | Pages connexion (email, Google), inscription, mot de passe oublié, page privée, déconnexion        | `auth-core`   | [SPEC-auth-web.md](SPEC-auth-web.md)       |
| `auth-mobile`        | Mêmes écrans dans l'app Expo, en email et mot de passe                                             | `auth-core`   | [SPEC-auth-mobile.md](SPEC-auth-mobile.md) |
| `auth-mobile-google` | Connexion Google sur mobile (module natif, build de développement Expo)                            | `auth-mobile` | À écrire                                   |

Ordre de construction : `api-deploy` → `auth-core` → `auth-web`, `auth-mobile` (parallélisables) → `auth-mobile-google`.

## Décisions transverses

- **Le profil passe par l'API.** Le client s'authentifie auprès de Firebase Auth, puis envoie son jeton d'identité à l'API, qui lit et écrit `users/{uid}` avec le SDK Admin. Les règles Firestore restent « deny all » : aucun accès direct depuis un client.
- **Profil** : `users/{uid}` = `{ pseudo, createdAt }`. Pseudo non unique. Pas de vérification d'email.
- **Compte sans profil** : si le profil n'existe pas encore (échec réseau à l'inscription, première connexion Google), la page privée demande le pseudo avant d'afficher le reste.
- **Local** : emulators Auth, Firestore et Functions ; aucune donnée réelle.
- **Étape manuelle** : activer Google dans la console Firebase (Authentication, Sign-in method). Firebase y crée son client OAuth.
