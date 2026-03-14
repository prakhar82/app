param(
  [Parameter(Mandatory = $true)]
  [string]$SubscriptionId,
  [string]$RepoUrl = "https://github.com/prakhar82/app.git",
  [string]$Branch = "main",
  [string]$ResourceGroup = "grocery-free-rg",
  [string]$Location = "eastus",
  [string]$VmName = "grocery-free-vm",
  [string]$AdminUser = "azureuser",
  [string]$VmSize = "AUTO_1CPU",
  [string]$FrontendOrigin = "",
  [string]$AdditionalCorsOrigins = ""
)

$ErrorActionPreference = "Stop"

$scriptPath = Join-Path $PSScriptRoot "docker\azure\deploy-free.ps1"
if (-not (Test-Path $scriptPath)) {
  throw "Missing deployment script: $scriptPath"
}

& $scriptPath `
  -SubscriptionId $SubscriptionId `
  -RepoUrl $RepoUrl `
  -Branch $Branch `
  -ResourceGroup $ResourceGroup `
  -Location $Location `
  -VmName $VmName `
  -AdminUser $AdminUser `
  -VmSize $VmSize `
  -FrontendOrigin $FrontendOrigin `
  -AdditionalCorsOrigins $AdditionalCorsOrigins
