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
  [string]$VmSize = "AUTO_1CPU",
  [string]$FrontendOrigin = "",
  [string]$AdditionalCorsOrigins = "",
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

function Resolve-VmSize {
  param(
    [string]$RequestedVmSize,
    [string]$Region
  )

  if ($RequestedVmSize -ne "AUTO_1CPU") {
    return $RequestedVmSize
  }

  Write-Host "Resolving cheapest available 1-vCPU VM in $Region..."
  $preferred = @(
    "Standard_B1ls",
    "Standard_B1s",
    "Standard_B1ms",
    "Standard_A1_v2",
    "Standard_D1_v2"
  )

  $availableRaw = az vm list-skus `
    --location $Region `
    --resource-type virtualMachines `
    --all `
    --query "[?restrictions==null && capabilities[?name=='vCPUs' && value=='1']].name | [].name" `
    -o tsv

  if ($LASTEXITCODE -ne 0) {
    throw "Unable to query available VM sizes for region $Region"
  }

  $available = @($availableRaw -split "`r?`n" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
  if ($available.Count -eq 0) {
    throw "No 1-vCPU VM sizes available in region $Region for this subscription."
  }

  foreach ($size in $preferred) {
    if ($available -contains $size) {
      return $size
    }
  }

  return $available[0]
}

Write-Host "Logging in to Azure..."
az login | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Azure login failed." }
az account set --subscription $SubscriptionId
if ($LASTEXITCODE -ne 0) { throw "Unable to select subscription: $SubscriptionId" }

Write-Host "Creating resource group: $ResourceGroup ($Location)"
az group create -n $ResourceGroup -l $Location | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Resource group creation failed." }

$effectiveVmSize = Resolve-VmSize -RequestedVmSize $VmSize -Region $Location
Write-Host "Creating VM: $VmName (size=$effectiveVmSize, location=$Location)"
az vm create `
  -g $ResourceGroup `
  -n $VmName `
  --image Ubuntu2204 `
  --size $effectiveVmSize `
  --admin-username $AdminUser `
  --generate-ssh-keys `
  --public-ip-sku Standard `
  --custom-data $tmpCloudInit | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "VM creation failed. Try another location or pass explicit size with -VmSize (for example Standard_B1s)."
}

Write-Host "Opening inbound ports (80, 8080, 8025, 22)..."
az vm open-port -g $ResourceGroup -n $VmName --port 80 | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Failed to open port 80." }
az vm open-port -g $ResourceGroup -n $VmName --port 8080 | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Failed to open port 8080." }
az vm open-port -g $ResourceGroup -n $VmName --port 8025 | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Failed to open port 8025." }
az vm open-port -g $ResourceGroup -n $VmName --port 22 | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Failed to open port 22." }

$ip = az vm show -d -g $ResourceGroup -n $VmName --query publicIps -o tsv
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($ip)) {
  throw "VM created but unable to fetch public IP."
}

$resolvedFrontendOrigin = if ([string]::IsNullOrWhiteSpace($FrontendOrigin)) {
  "http://$ip:8080"
} else {
  $FrontendOrigin
}

$corsOrigins = New-Object System.Collections.Generic.List[string]
foreach ($origin in @(
  "http://localhost",
  "http://localhost:4200",
  "http://localhost:8080",
  "http://127.0.0.1",
  "http://127.0.0.1:8080",
  "http://$ip",
  "http://$ip:8080",
  $resolvedFrontendOrigin
)) {
  if (-not [string]::IsNullOrWhiteSpace($origin) -and -not $corsOrigins.Contains($origin)) {
    $corsOrigins.Add($origin)
  }
}

if (-not [string]::IsNullOrWhiteSpace($AdditionalCorsOrigins)) {
  foreach ($origin in ($AdditionalCorsOrigins -split ",")) {
    $trimmed = $origin.Trim()
    if (-not [string]::IsNullOrWhiteSpace($trimmed) -and -not $corsOrigins.Contains($trimmed)) {
      $corsOrigins.Add($trimmed)
    }
  }
}

$corsValue = [string]::Join(",", $corsOrigins)

Write-Host "Applying public origin configuration on VM..."
az vm run-command invoke `
  -g $ResourceGroup `
  -n $VmName `
  --command-id RunShellScript `
  --scripts @(
    'set -euo pipefail',
    'mkdir -p /opt/grocery',
    "cat > /opt/grocery/deploy-config.env <<'EOF'",
    "FRONTEND_URL=$resolvedFrontendOrigin",
    "APP_CORS_ALLOWED_ORIGINS=$corsValue",
    'EOF',
    'while [ ! -f /opt/grocery/deploy.sh ]; do sleep 5; done',
    'while [ ! -d /opt/grocery/app ]; do sleep 5; done',
    'if [ ! -f /opt/grocery/app/.env ]; then touch /opt/grocery/app/.env; fi',
    'while IFS= read -r line; do',
    '  key=${line%%=*}',
    '  value=${line#*=}',
    '  if grep -q "^${key}=" /opt/grocery/app/.env; then',
    '    sed -i "s|^${key}=.*|${key}=${value}|" /opt/grocery/app/.env',
    '  else',
    '    printf "%s\n" "$line" >> /opt/grocery/app/.env',
    '  fi',
    'done < /opt/grocery/deploy-config.env',
    'cd /opt/grocery/app',
    'docker compose down || true',
    "sudo REPO_URL='$RepoUrl' BRANCH='$Branch' /opt/grocery/deploy.sh"
  ) | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "VM created, but failed to apply CORS/frontend configuration."
}

Write-Host ""
Write-Host "Deployment requested. Wait 3-8 minutes for cloud-init + Docker build."
Write-Host "Public IP: $ip"
Write-Host "App URL:       $resolvedFrontendOrigin/login"
Write-Host "Swagger URL:   http://$ip:8080/swagger-ui/index.html"
Write-Host "MailHog URL:   http://$ip:8025"
Write-Host "CORS Origins:  $corsValue"
Write-Host ""
Write-Host "Seed login:"
Write-Host "  Admin: admin@grocery.local / Admin@123"
Write-Host "  User:  user@grocery.local / User@123"
Write-Host ""
Write-Host "Check server deployment log:"
Write-Host "  ssh $AdminUser@$ip"
Write-Host "  sudo tail -n 200 /var/log/grocery-deploy.log"
