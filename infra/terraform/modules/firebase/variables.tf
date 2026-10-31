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

variable "budget_amount" {
  description = "Montant mensuel du budget, dans la devise du compte de facturation."
  type        = number
  default     = 5
}

variable "budget_currency" {
  description = "Devise du compte de facturation."
  type        = string
  default     = "EUR"
}

variable "budget_alert_thresholds" {
  description = "Seuils d'alerte en fraction du budget."
  type        = list(number)
  default     = [0.5, 0.9, 1]
}
