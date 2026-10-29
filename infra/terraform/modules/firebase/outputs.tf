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
