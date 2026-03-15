#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [[ ! -f ".env.vm" ]]; then
  if [[ -f ".env.vm.example" ]]; then
    cp .env.vm.example .env.vm
    echo "Created .env.vm from .env.vm.example"
  else
    echo ".env.vm or .env.vm.example not found"
    exit 1
  fi
fi

docker compose --env-file .env.vm up -d --build
