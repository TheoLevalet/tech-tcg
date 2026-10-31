provider "google" {
  region                = "europe-west1"
  user_project_override = true
  billing_project       = var.project_id
}

provider "google-beta" {
  region                = "europe-west1"
  user_project_override = true
  billing_project       = var.project_id
}

# Le projet et ses APIs sont créés avant que le projet puisse servir de projet de quota.
provider "google-beta" {
  alias                 = "no_user_project_override"
  region                = "europe-west1"
  user_project_override = false
}

module "firebase" {
  source = "../../modules/firebase"

  providers = {
    google                               = google
    google-beta                          = google-beta
    google-beta.no_user_project_override = google-beta.no_user_project_override
  }

  project_id      = var.project_id
  project_name    = "Tech TCG dev"
  billing_account = var.billing_account
  org_id          = var.org_id
  folder_id       = var.folder_id
}

module "github_deploy" {
  source = "../../modules/github-deploy"

  project_id           = module.firebase.project_id
  github_repository_id = "1438514464"
  roles = [
    "roles/cloudfunctions.admin",
    "roles/firebasehosting.admin",
    "roles/run.admin",
    "roles/serviceusage.serviceUsageConsumer",
  ]
}

module "api_runtime" {
  source = "../../modules/api-runtime"

  project_id               = module.firebase.project_id
  project_number           = module.firebase.project_number
  deployer_service_account = module.github_deploy.service_account
}

output "project_id" {
  value = module.firebase.project_id
}

output "state_bucket" {
  value = module.firebase.state_bucket
}

output "github_workload_identity_provider" {
  value = module.github_deploy.workload_identity_provider
}

output "github_service_account" {
  value = module.github_deploy.service_account
}

output "firebase_web_config" {
  value = module.firebase.web_config
}
