$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

if (-not (Test-Path ".env.local")) {
  if (Test-Path ".env.local.example") {
    Copy-Item ".env.local.example" ".env.local"
    Write-Host "Created .env.local from .env.local.example"
  } else {
    throw ".env.local or .env.local.example not found."
  }
}

docker compose --env-file .env.local up -d --build
