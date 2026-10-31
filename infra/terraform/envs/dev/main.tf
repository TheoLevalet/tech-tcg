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

output "project_id" {
  value = module.firebase.project_id
}

output "state_bucket" {
  value = module.firebase.state_bucket
}
