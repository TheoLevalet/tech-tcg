variable "project_id" {
  description = "Projet dans lequel GitHub Actions déploie."
  type        = string
}

variable "github_repository_id" {
  description = "Identifiant numérique du repo GitHub, stable en cas de renommage."
  type        = string
}

variable "github_ref" {
  description = "Seule ref autorisée à obtenir un jeton."
  type        = string
  default     = "refs/heads/main"
}

variable "roles" {
  description = "Rôles du compte de service de déploiement."
  type        = list(string)
}
