param(
  [Parameter(Mandatory = $true)]
  [string]$SubscriptionId,

  [Parameter(Mandatory = $true)]
  [string]$RepoUrl,

  [string]$Branch = "main",
  [string]$ResourceGroup = "grocery-free-rg",
  [string]$Location = "eastus",
  [string]$VmName = "grocery-free-vm",
  [string]$AdminUser = "azureuser",
  [string]$CloudInitPath = ".\docker\azure\cloud-init-compose.yaml"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $CloudInitPath)) {
  throw "Cloud-init file not found: $CloudInitPath"
}

$tmpCloudInit = Join-Path $env:TEMP "cloud-init-grocery.yaml"
$content = Get-Content -Path $CloudInitPath -Raw
$content = $content.Replace("https://github.com/REPLACE_ME/REPLACE_ME.git", $RepoUrl)
$content = $content.Replace("BRANCH='main'", "BRANCH='$Branch'")
Set-Content -Path $tmpCloudInit -Value $content -Encoding utf8

Write-Host "Logging in to Azure..."
az login | Out-Null
az account set --subscription $SubscriptionId

Write-Host "Creating resource group: $ResourceGroup ($Location)"
az group create -n $ResourceGroup -l $Location | Out-Null

Write-Host "Creating VM: $VmName"
az vm create `
  -g $ResourceGroup `
  -n $VmName `
  --image Ubuntu2204 `
  --size Standard_B1s `
  --admin-username $AdminUser `
  --generate-ssh-keys `
  --public-ip-sku Standard `
  --custom-data $tmpCloudInit | Out-Null

Write-Host "Opening inbound ports (80, 8080, 8025, 22)..."
az vm open-port -g $ResourceGroup -n $VmName --port 80 | Out-Null
az vm open-port -g $ResourceGroup -n $VmName --port 8080 | Out-Null
az vm open-port -g $ResourceGroup -n $VmName --port 8025 | Out-Null
az vm open-port -g $ResourceGroup -n $VmName --port 22 | Out-Null

$ip = az vm show -d -g $ResourceGroup -n $VmName --query publicIps -o tsv

Write-Host ""
Write-Host "Deployment requested. Wait 3-8 minutes for cloud-init + Docker build."
Write-Host "Public IP: $ip"
Write-Host "App URL:       http://$ip:8080/login"
Write-Host "Swagger URL:   http://$ip:8080/swagger-ui/index.html"
Write-Host "MailHog URL:   http://$ip:8025"
Write-Host ""
Write-Host "Seed login:"
Write-Host "  Admin: admin@grocery.local / Admin@123"
Write-Host "  User:  user@grocery.local / User@123"
Write-Host ""
Write-Host "Check server deployment log:"
Write-Host "  ssh $AdminUser@$ip"
Write-Host "  sudo tail -n 200 /var/log/grocery-deploy.log"
