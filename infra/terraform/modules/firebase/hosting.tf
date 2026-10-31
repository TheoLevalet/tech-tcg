resource "google_firebase_web_app" "web" {
  provider = google-beta

  project      = google_project.this.project_id
  display_name = "Tech TCG web"

  depends_on = [google_firebase_project.this]
}

resource "google_firebase_hosting_site" "web" {
  provider = google-beta

  project = google_project.this.project_id
  site_id = google_project.this.project_id
  app_id  = google_firebase_web_app.web.app_id
}

data "google_firebase_web_app_config" "web" {
  provider = google-beta

  project    = google_project.this.project_id
  web_app_id = google_firebase_web_app.web.app_id
}
