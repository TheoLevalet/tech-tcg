# Configuration partielle : voir backend.hcl.example.
# Premier déploiement : commenter ce bloc, appliquer avec un state local,
# puis le rétablir et lancer `terraform init -migrate-state`.
terraform {
  backend "gcs" {}
}
