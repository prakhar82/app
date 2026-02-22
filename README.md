# Grocery Shop Microservices + Angular

Production-minded starter for a grocery platform with Java microservices, Spring Cloud Gateway, PostgreSQL, Flyway, and Angular SPA.

## Architecture

- `identity-service` (auth, DEV login, Google OAuth2-ready, JWT)
- `catalog-service` (categories/subcategories/products, Excel upload)
- `inventory-service` (stock + reservation)
- `cart-service`
- `order-service` (checkout + orchestration)
- `payment-service` (dummy provider + webhook)
- `gateway` (routing, CORS, auth boundary)
- `ui-angular` (Angular SPA)

## Local Docker Setup (Verified)

### Prerequisites

- Docker Desktop
- Ports available:
  - `80` (UI)
  - `8080` (Gateway)
  - `5433` (PostgreSQL host-mapped)

### 1) Start stack

```powershell
cd C:\prakhar\java-work\app
docker compose up --build -d
```

### 2) Check health

```powershell
docker compose ps
```

All services should be `Up`.

### 3) Access URLs (Single Host)

- UI: `http://localhost:8080`
- Login page: `http://localhost:8080/login`
- Gateway direct: `http://localhost:8080`
- Swagger UI (aggregated): `http://localhost:8080/swagger-ui/index.html`
- Swagger UI (aggregated alternate): `http://localhost:8080/swagger-ui.html`

Per-service OpenAPI YAML (via one URL host):

- `http://localhost/api/identity/v3/api-docs.yaml`
- `http://localhost/api/catalog/v3/api-docs.yaml`
- `http://localhost/api/inventory/v3/api-docs.yaml`
- `http://localhost/api/cart/v3/api-docs.yaml`
- `http://localhost/api/orders/v3/api-docs.yaml`
- `http://localhost/api/payments/v3/api-docs.yaml`

## Test Users (Seeded)

DEV auth mode is enabled by default.

- Admin: `admin@grocery.local` / `Admin@123`
- User: `user@grocery.local` / `User@123`

## Seed Data Included

Seeded automatically at startup using Flyway + startup seeding:

- Categories: Fruits, Vegetables, Dairy
- Subcategories: Citrus, Berries, Leafy, Milk, Cheese
- Products: Orange, Apple, Strawberry, Spinach, Milk 1L, Cheddar 200g
- Inventory quantities per product

## Quick API Tests

### Login

```powershell
$body = @{email='admin@grocery.local'; password='Admin@123'} | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:8080/api/identity/auth/login' -Method Post -ContentType 'application/json' -Body $body
```

### Catalog list

```powershell
Invoke-RestMethod -Uri 'http://localhost:8080/api/catalog/catalog/products' -Method Get
```

## Config

Use `.env.example` as base:

```powershell
Copy-Item .env.example .env
```

Key envs:

- `AUTH_MODE=DEV|GOOGLE`
- `JWT_SECRET=...`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `APP_CORS_ALLOWED_ORIGINS`

## Common Issues

### Initial 502 right after `docker compose up`

- Services need ~20-60 seconds to warm up on first run/rebuild.
- If you see temporary `502 Bad Gateway`, wait 30 seconds and refresh.

### Blank UI / cannot load data

- Ensure gateway is on `8080` and UI on `80`.
- Hard refresh browser (`Ctrl+F5`).
- Verify containers:
  ```powershell
  docker compose ps -a
  ```

### Port conflicts

This project already remaps:

- Postgres host port `5433` -> container `5432`
- Gateway host port `8080` -> container `8080`
- UI host port `80` -> container `80`

If conflicts still occur, edit `docker-compose.yml` and restart.

### Rebuild cleanly

```powershell
docker compose down
docker compose up --build -d
```

## Azure Deployment Guide

This repository contains `k8s/base` manifests (deployments/services/ingress/configmap/secret placeholders).

For a low-cost single-VM deployment (recommended for quick global access), use:

- `docker/azure/README-AZURE-FREE.md`
- `docker/azure/deploy-free.ps1`
- `docker/azure/cloud-init-compose.yaml`

### Target Azure Services

- Azure Container Registry (ACR)
- Azure Kubernetes Service (AKS)
- Azure Database for PostgreSQL Flexible Server
- (Optional) Azure Key Vault + CSI driver

### 1) Build and push images to ACR

Example:

```bash
az acr login --name <acrName>

docker build -t <acrLoginServer>/identity-service:latest -f identity-service/Dockerfile .
docker build -t <acrLoginServer>/catalog-service:latest -f catalog-service/Dockerfile .
docker build -t <acrLoginServer>/inventory-service:latest -f inventory-service/Dockerfile .
docker build -t <acrLoginServer>/cart-service:latest -f cart-service/Dockerfile .
docker build -t <acrLoginServer>/order-service:latest -f order-service/Dockerfile .
docker build -t <acrLoginServer>/payment-service:latest -f payment-service/Dockerfile .
docker build -t <acrLoginServer>/gateway:latest -f gateway/Dockerfile .
docker build -t <acrLoginServer>/ui-angular:latest -f ui-angular/Dockerfile ui-angular

docker push <acrLoginServer>/identity-service:latest
docker push <acrLoginServer>/catalog-service:latest
docker push <acrLoginServer>/inventory-service:latest
docker push <acrLoginServer>/cart-service:latest
docker push <acrLoginServer>/order-service:latest
docker push <acrLoginServer>/payment-service:latest
docker push <acrLoginServer>/gateway:latest
docker push <acrLoginServer>/ui-angular:latest
```

### 2) Configure AKS access

```bash
az aks get-credentials --resource-group <rg> --name <aksName>
```

### 3) Update manifests

In `k8s/base/*.yaml`:

- Replace `your-acr.azurecr.io/...` image names with actual ACR login server.
- Replace DB settings to use Azure PostgreSQL (preferred over in-cluster postgres for production).
- Set secrets (`JWT_SECRET`, DB credentials, Google OAuth secrets).

### 4) Deploy

```bash
kubectl apply -k k8s/base
```

### 5) Ingress

- Install NGINX ingress controller in AKS if not present.
- Update `k8s/base/ingress.yaml` host.
- Point DNS to ingress public IP.

## Security Notes

- Change `JWT_SECRET` for any non-local environment.
- Keep `AUTH_MODE=GOOGLE` in production.
- Move secrets to Key Vault (do not keep in plain manifests).
- Restrict CORS origins.

## Project Layout

- `gateway/`
- `identity-service/`
- `catalog-service/`
- `inventory-service/`
- `cart-service/`
- `order-service/`
- `payment-service/`
- `ui-angular/`
- `k8s/`
- `docker/`
- `samples/`

## Stop stack

```powershell
docker compose down
```
