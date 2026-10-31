# Spec : api-deploy

Module de [CAPABILITY-MAP.md](CAPABILITY-MAP.md). Conventions générales : [SPEC.md](SPEC.md).

## Objectif

Déployer automatiquement `apps/api` sur Cloud Functions à chaque push sur `main`, en plus de Firebase Hosting, pour que `https://tech-tcg-dev.web.app/api/**` réponde. Prérequis de `auth-core`, dont les routes vivent dans l'API.

## Comportement attendu

- `https://tech-tcg-dev.web.app/api/health` répond `200 {"status":"ok"}`.
- La page web actuelle affiche « API : ok ».
- La fonction `api` s'exécute sous un compte de service dédié `api-runtime`, et non sous le compte par défaut de Compute Engine (rôle Editor).
- `api-runtime` n'a que `roles/datastore.user`, nécessaire à `auth-core`.
- La fonction est publique (`invoker: public`) : l'authentification se fait dans l'API, par jeton Firebase.
- Les images de la fonction sont supprimées automatiquement au-delà des plus récentes (règle de nettoyage Artifact Registry gérée par Terraform).

## Tech Stack

Inchangée. `firebase-functions` v2 `onRequest`, Terraform `google` 8.x, workflow GitHub Actions existant.

## Commands

```bash
pnpm --filter @tech-tcg/api build
terraform -chdir=infra/terraform/envs/dev plan
pnpm exec firebase deploy --only hosting,functions --project tech-tcg-dev --non-interactive
```

## Project Structure

```
apps/api/src/index.ts                         → options onRequest : serviceAccount, invoker
infra/terraform/modules/api-runtime/          → compte api-runtime, dépôt gcf-artifacts et sa règle de nettoyage, droits Cloud Build
infra/terraform/envs/dev/main.tf              → instanciation, rôles supplémentaires de github-deployer
.github/workflows/deploy.yml                  → remplace deploy-hosting.yml, déploie hosting et functions
```

## Code Style

Celui de [SPEC.md](SPEC.md). Les options de la fonction restent regroupées dans `apps/api/src/index.ts` :

```ts
export const api = onRequest(
  {
    region: "europe-west1",
    minInstances: 0,
    maxInstances: 2,
    serviceAccount: "api-runtime@",
    invoker: "public",
  },
  async (req, res) => {
    (await handler)(req, res);
  },
);
```

## Testing Strategy

- Tests API existants inchangés (Vitest + `inject()`).
- Terraform : `validate`, `fmt -check`, puis `plan` relu avant `apply`.
- Workflow : `actionlint`. Premier run réel au merge sur `main`.
- Vérification finale : `curl https://tech-tcg-dev.web.app/api/health`.

## Boundaries

**Toujours**

- Droits minimaux : chaque rôle ajouté à `github-deployer` ou `api-runtime` est justifié dans le plan.
- Rôle `iam.serviceAccountUser` accordé sur `api-runtime` uniquement, pas sur le projet.

**Demander d'abord**

- `terraform apply`.
- Tout rôle de niveau administrateur projet (`roles/editor`, `roles/owner`, `roles/iam.*Admin`).

**Jamais**

- `firebase deploy --force` dans le workflow : il supprime sans confirmation les fonctions absentes du code.
- Clé de compte de service.

## Success Criteria

1. Un push sur `main` déploie hosting et functions ; le run est vert.
2. `curl https://tech-tcg-dev.web.app/api/health` renvoie `200 {"status":"ok"}`.
3. `gcloud functions describe api --region europe-west1` montre `api-runtime` comme compte d'exécution.
4. `terraform plan` sans changement après `apply`.

## Open Questions

1. Rôles exacts de `github-deployer` pour déployer une fonction 2nd gen : base prévue `cloudfunctions.developer`, `run.admin` (rendre la fonction publique), `iam.serviceAccountUser` sur `api-runtime`. À ajuster au premier run si une erreur `403` apparaît.
2. Cloud Build : dans les projets récents, il construit avec le compte par défaut de Compute Engine, qui n'a plus de rôle. Prévu : lui accorder `roles/cloudbuild.builds.builder`, ou un compte de build dédié si l'organisation l'impose.
