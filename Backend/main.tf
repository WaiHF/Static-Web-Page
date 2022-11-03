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
      name = "static_web_page"
    }
  }
}

# Provider settings
provider "azurerm" {
  features {}
}

# Resource group.
resource "azurerm_resource_group" "rg" {
  name     = "${var.name}_rg"
  location = var.location
}

# Static site app.
resource "azurerm_static_site" "app" {
  name                = var.name
  resource_group_name = azurerm_resource_group.rg.name
  location            = var.location
}