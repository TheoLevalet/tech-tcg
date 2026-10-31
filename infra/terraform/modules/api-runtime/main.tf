locals {
  build_service_account = "${var.project_number}-compute@developer.gserviceaccount.com"
}

resource "google_service_account" "runtime" {
  project      = var.project_id
  account_id   = "api-runtime"
  display_name = "Exécution de la fonction api"
}

resource "google_project_iam_member" "runtime_firestore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = google_service_account.runtime.member
}

# Dépôt utilisé par Cloud Functions pour les images de la fonction.
resource "google_artifact_registry_repository" "gcf_artifacts" {
  project       = var.project_id
  location      = var.region
  repository_id = "gcf-artifacts"
  format        = "DOCKER"

  cleanup_policy_dry_run = false

  cleanup_policies {
    id     = "keep-recent"
    action = "KEEP"
    most_recent_versions {
      keep_count = 3
    }
  }

  cleanup_policies {
    id     = "delete-old"
    action = "DELETE"
    condition {
      older_than = "86400s"
    }
  }
}

resource "google_project_iam_member" "build" {
  project = var.project_id
  role    = "roles/cloudbuild.builds.builder"
  member  = "serviceAccount:${local.build_service_account}"
}

resource "google_service_account_iam_member" "deployer_runtime" {
  service_account_id = google_service_account.runtime.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${var.deployer_service_account}"
}

resource "google_service_account_iam_member" "deployer_build" {
  service_account_id = "projects/${var.project_id}/serviceAccounts/${local.build_service_account}"
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${var.deployer_service_account}"
}

# Vérifié par le CLI Firebase avant tout déploiement de functions.
resource "google_service_account_iam_member" "deployer_appspot" {
  service_account_id = "projects/${var.project_id}/serviceAccounts/${var.project_id}@appspot.gserviceaccount.com"
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${var.deployer_service_account}"
}
