variable "project_id" {
  description = "Identifiant du projet GCP / Firebase."
  type        = string
}

variable "project_name" {
  description = "Nom affiché du projet."
  type        = string
}

variable "billing_account" {
  description = "Compte de facturation (plan Blaze requis pour Cloud Functions)."
  type        = string
}

variable "org_id" {
  description = "Organisation parente. Laisser null si folder_id est renseigné ou sans organisation."
  type        = string
  default     = null
}

variable "folder_id" {
  description = "Dossier parent. Prioritaire sur org_id."
  type        = string
  default     = null
}

variable "region" {
  description = "Région des ressources régionales."
  type        = string
  default     = "europe-west1"
}

variable "state_bucket_location" {
  description = "Localisation du bucket de state Terraform."
  type        = string
  default     = "EU"
}
