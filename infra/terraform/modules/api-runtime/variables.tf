variable "project_id" {
  description = "Projet de la fonction api."
  type        = string
}

variable "project_number" {
  description = "Numéro du projet, pour le compte de build par défaut."
  type        = string
}

variable "region" {
  description = "Région de la fonction et de son dépôt d'images."
  type        = string
  default     = "europe-west1"
}

variable "deployer_service_account" {
  description = "Email du compte qui déploie la fonction."
  type        = string
}
