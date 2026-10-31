resource "google_firestore_database" "default" {
  provider = google-beta

  project     = google_project.this.project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"

  depends_on = [google_firebase_project.this]
}
