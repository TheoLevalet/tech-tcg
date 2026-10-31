output "project_id" {
  value = google_project.this.project_id
}

output "project_number" {
  value = google_project.this.number
}

output "state_bucket" {
  value = google_storage_bucket.tfstate.name
}

output "web_app_id" {
  value = google_firebase_web_app.web.app_id
}

output "hosting_site" {
  value = google_firebase_hosting_site.web.site_id
}

# Configuration publique du SDK client : elle finit dans le code envoyé au navigateur.
output "web_config" {
  value = {
    api_key     = data.google_firebase_web_app_config.web.api_key
    auth_domain = data.google_firebase_web_app_config.web.auth_domain
    app_id      = google_firebase_web_app.web.app_id
  }
}
