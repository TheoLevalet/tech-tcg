resource "google_identity_platform_config" "this" {
  provider = google-beta

  project = google_project.this.project_id

  sign_in {
    email {
      enabled           = true
      password_required = true
    }

    phone_number {
      enabled = false
    }
  }

  authorized_domains = [
    "localhost",
    "${google_project.this.project_id}.web.app",
    "${google_project.this.project_id}.firebaseapp.com",
  ]

  depends_on = [google_firebase_project.this]
}
