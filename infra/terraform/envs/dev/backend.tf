# Configuration partielle : voir backend.hcl.example.
# Premier déploiement : state local via backend_override.tf (voir README).
terraform {
  backend "gcs" {}
}
