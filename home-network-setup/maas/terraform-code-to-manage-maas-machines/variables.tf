
################################################################################
# Boiler-plate (for the MAAS provider)
################################################################################

variable "maas_api_key" {
  type = string
  sensitive = true
  nullable = false
}

variable "maas_api_url" {
  type = string
  sensitive = true
  nullable = false
}

################################################################################
# For custom TF scripts
################################################################################

variable "pxe_cidr" {
  type = string
  nullable = false
}

# Machine #1
variable "machine_1_mac" {
  type = string
  nullable = false
}

variable "machine_1_hostname" {
  type = string
  nullable = false
}

# Machine #2
variable "machine_2_mac" {
  type = string
  nullable = false
}

variable "machine_2_hostname" {
  type = string
  nullable = false
}


