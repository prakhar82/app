# Azure Free Deployment (Single VM + Docker Compose)

This is the lowest-cost way to publish this app globally on Azure with your current architecture.

## Important

- No true always-free production environment exists for full microservices + database.
- This guide uses a single Ubuntu VM (`Standard_B1s`) to minimize cost.
- If you are on Azure Free Account, VM usage may be free within free-tier limits.

## Files in this folder

- `cloud-init-compose.yaml`: VM startup script (installs Docker and deploys app automatically)
- `deploy-free.ps1`: Windows PowerShell script to create VM and deploy app

## Prerequisites

1. Azure subscription.
2. Azure CLI installed: `az --version`
3. Logged in with Azure CLI permissions to create resources.
4. Your Git repository URL containing this project.

## One-command deployment (PowerShell)

From repository root:

```powershell
.\docker\azure\deploy-free.ps1 `
  -SubscriptionId "<YOUR_SUBSCRIPTION_ID>" `
  -RepoUrl "https://github.com/<ORG>/<REPO>.git" `
  -Branch "main"
```

Optional parameters:

```powershell
-ResourceGroup "grocery-free-rg"
-Location "eastus"
-VmName "grocery-free-vm"
-AdminUser "azureuser"
```

## After script finishes

Wait around 3-8 minutes for cloud-init and Docker image build.

Access:

- App: `http://<PUBLIC_IP>:8080/login`
- Swagger: `http://<PUBLIC_IP>:8080/swagger-ui/index.html`
- MailHog (DEV email): `http://<PUBLIC_IP>:8025`

Seed users:

- Admin: `admin@grocery.local / Admin@123`
- User: `user@grocery.local / User@123`

## Validate on VM

```bash
ssh azureuser@<PUBLIC_IP>
sudo tail -n 200 /var/log/grocery-deploy.log
docker ps
```

## Re-deploy latest code

```bash
ssh azureuser@<PUBLIC_IP>
sudo REPO_URL='https://github.com/<ORG>/<REPO>.git' BRANCH='main' /opt/grocery/deploy.sh
```

## Cost-control commands

Stop VM when not used:

```powershell
az vm deallocate -g grocery-free-rg -n grocery-free-vm
```

Start VM again:

```powershell
az vm start -g grocery-free-rg -n grocery-free-vm
```

Delete all resources:

```powershell
az group delete -n grocery-free-rg --yes --no-wait
```
