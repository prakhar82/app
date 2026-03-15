#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${REPO_URL:-}"
BRANCH="${BRANCH:-main}"
APP_DIR="${APP_DIR:-/opt/grocery/app}"
VM_IP="${VM_IP:-}"
JWT_SECRET="${JWT_SECRET:-replace-with-very-strong-32-char-secret}"
STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-}"

if [[ -z "${REPO_URL}" ]]; then
  echo "REPO_URL is required"
  exit 1
fi

if [[ -z "${VM_IP}" ]]; then
  VM_IP="$(curl -fsSL https://api.ipify.org || true)"
fi

if [[ -z "${VM_IP}" ]]; then
  echo "VM_IP is required when public IP auto-detection fails"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y ca-certificates curl git gnupg lsb-release

install -m 0755 -d /etc/apt/keyrings
if [[ ! -f /etc/apt/keyrings/docker.asc ]]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
fi

ARCH="$(dpkg --print-architecture)"
CODENAME="$(. /etc/os-release && echo "${VERSION_CODENAME}")"
echo \
  "deb [arch=${ARCH} signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${CODENAME} stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable docker
systemctl start docker

mkdir -p "$(dirname "${APP_DIR}")"
if [[ -d "${APP_DIR}/.git" ]]; then
  git -C "${APP_DIR}" fetch origin
  git -C "${APP_DIR}" checkout "${BRANCH}"
  git -C "${APP_DIR}" pull origin "${BRANCH}"
else
  rm -rf "${APP_DIR}"
  git clone --branch "${BRANCH}" "${REPO_URL}" "${APP_DIR}"
fi

cat > "${APP_DIR}/.env" <<EOF
AUTH_MODE=DEV
JWT_SECRET=${JWT_SECRET}
FRONTEND_URL=http://${VM_IP}:8080
APP_CORS_ALLOWED_ORIGINS=http://${VM_IP},http://${VM_IP}:8080,http://localhost,http://localhost:8080,http://127.0.0.1,http://127.0.0.1:8080
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
SMTP_HOST=mailhog
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_AUTH=false
SMTP_STARTTLS_ENABLE=false
MAIL_FROM=prakhar.unique@gmail.com
GOOGLE_CLIENT_ID=dummy
GOOGLE_CLIENT_SECRET=dummy
EOF

cd "${APP_DIR}"
docker compose up -d --build

echo "Deployment complete."
echo "App URL: http://${VM_IP}:8080"
