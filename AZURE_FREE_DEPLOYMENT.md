# Azure Free/Cheap Deployment Guide (Presentation + Learning)

This guide deploys your Docker Compose stack to one low-cost Azure VM (best for demos/learning).

## 1) Run From This Folder

Use PowerShell in:

`C:\Prakhar\java-work\app`

```powershell
cd C:\Prakhar\java-work\app
```

## 2) Prerequisites

1. Azure subscription
2. Azure CLI installed
3. GitHub repo reachable: `https://github.com/prakhar82/app.git`

Install Azure CLI if missing:

```powershell
winget install -e --id Microsoft.AzureCLI
```

Validate:

```powershell
az --version
```

## 3) PowerShell Script Permission (if blocked)

If you see `running scripts is disabled`:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
```

## 4) Important Azure Capacity Rule

- VM SKUs may be unavailable in a region (`SkuNotAvailable`).
- Resource Group location is fixed once created.
- If changing region, use a new resource group name.
- This script now supports auto-size mode: `AUTO_1CPU` (default).
- `AUTO_1CPU` picks the cheapest available 1-vCPU SKU in your selected region.

## 5) Recommended Auto-Retry Deployment (copy/paste)

This tries multiple regions using `AUTO_1CPU` (lowest-cost mode).

```powershell
$sub = "2dccba84-7038-4126-b0b2-32f8f29bcbd4"

$candidates = @(
  @{ rg="grocery-rg-westus3-1cpu";      loc="westus3" },
  @{ rg="grocery-rg-westus2-1cpu";      loc="westus2" },
  @{ rg="grocery-rg-eastus2-1cpu";      loc="eastus2" },
  @{ rg="grocery-rg-centralus-1cpu";    loc="centralus" }
)

foreach ($c in $candidates) {
  Write-Host "Trying $($c.loc) / AUTO_1CPU / $($c.rg)..."
  try {
    .\deploy-azure-free.ps1 `
      -SubscriptionId $sub `
      -ResourceGroup $c.rg `
      -Location $c.loc
    Write-Host "SUCCESS on $($c.loc)"
    break
  } catch {
    Write-Host "FAILED: $($_.Exception.Message)"
  }
}
```

## 6) Single Attempt Command (manual)

```powershell
.\deploy-azure-free.ps1 `
  -SubscriptionId "2dccba84-7038-4126-b0b2-32f8f29bcbd4" `
  -ResourceGroup "grocery-rg-westus3-1cpu" `
  -Location "westus3"
```

If you want explicit manual size (advanced):

```powershell
.\deploy-azure-free.ps1 `
  -SubscriptionId "2dccba84-7038-4126-b0b2-32f8f29bcbd4" `
  -ResourceGroup "grocery-rg-westus3-b1s" `
  -Location "westus3" `
  -VmSize "Standard_B1s"
```

## 7) What Deployment Script Does

1. `az login` + subscription set
2. Create resource group
3. Create Ubuntu VM
4. Open ports: `22`, `80`, `8080`, `8025`
5. Cloud-init installs Docker + runs `docker compose up -d --build`
6. Script detects the VM public IP, writes `FRONTEND_URL` and `APP_CORS_ALLOWED_ORIGINS`, and re-runs deployment so browser requests to the public host do not fail CORS

## 8) Access URLs

After successful run, wait ~5-10 minutes, then open:

- App: `http://<PUBLIC_IP>:8080/login`
- Swagger: `http://<PUBLIC_IP>:8080/swagger-ui/index.html`
- MailHog: `http://<PUBLIC_IP>:8025`

If your frontend is hosted on another origin, pass it explicitly:

```powershell
.\deploy-azure-free.ps1 `
  -SubscriptionId "2dccba84-7038-4126-b0b2-32f8f29bcbd4" `
  -ResourceGroup "grocery-rg-westus3-1cpu" `
  -Location "westus3" `
  -FrontendOrigin "https://shop.example.com" `
  -AdditionalCorsOrigins "https://www.shop.example.com"
```

Seed users:

- Admin: `admin@grocery.local / Admin@123`
- User: `user@grocery.local / User@123`

## 9) Verify VM/App

```powershell
ssh azureuser@<PUBLIC_IP>
sudo tail -n 200 /var/log/grocery-deploy.log
docker ps
```

## 10) Re-deploy Latest Code

```powershell
ssh azureuser@<PUBLIC_IP>
sudo REPO_URL='https://github.com/prakhar82/app.git' BRANCH='main' /opt/grocery/deploy.sh
```

## 11) Cost Control

Stop VM:

```powershell
az vm deallocate -g <RESOURCE_GROUP> -n grocery-free-vm
```

Start VM:

```powershell
az vm start -g <RESOURCE_GROUP> -n grocery-free-vm
```

Delete all resources:

```powershell
az group delete -n <RESOURCE_GROUP> --yes --no-wait
```

## 12) Known Errors and Fix

- `SkuNotAvailable`: change `-Location` and/or `-VmSize`.
- `InvalidResourceGroupLocation`: use a new `-ResourceGroup` when changing region.
- `running scripts is disabled`: run step 3 first.
- `QuotaExceeded`: switch region/family or request quota increase in Azure portal.
