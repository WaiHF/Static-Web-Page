# Terraform settings
terraform {
  required_version = "~> 1.3.4"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.29.1"
    }
  }

  cloud {
    organization = "WaiHF"
    workspaces {
      name = var.name
    }
  }
}

# Provider settings
provider "azurerm" {
  features {}
}

# Resource group.
resource "azurerm_resource_group" "rg" {
  name     = format(var.name, "_rg")
  location = var.location
}

# Static site app.
resource "azurerm_static_site" "web" {
  name                = var.name
  resource_group_name = format(var.name, "_rg")
  location            = var.location
}