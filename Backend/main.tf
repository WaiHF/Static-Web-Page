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
      name = "static-web-page"
    }
  }
}

# Provider settings
provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "rg" {
  name     = "staticpage_rg"
  location = "eastus"
}

resource "azurerm_static_site" "web" {
  name = "staticpage"
  resource_group_name = azurerm_resource_group.rg.name
  location = "eastus"
}