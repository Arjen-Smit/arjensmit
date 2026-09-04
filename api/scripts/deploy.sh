#!/usr/bin/env bash
# Deploys the API to mijn.host.
#
# Prerequisites (one-off, see README.md):
#   - the `arjensmit-deploy` SSH host alias exists on this machine
#   - the Node.js app exists on the server (cloudlinux-selector create ... / DirectAdmin "Setup Node.js App")
#
# What it does: validate + build locally, sync the runtime files, install production
# dependencies inside the app's Node virtualenv, restart the app, and probe the health endpoint.
set -euo pipefail

HOST="${DEPLOY_HOST:-arjensmit-deploy}"
APP_ROOT="${DEPLOY_APP_ROOT:-domains/arjensmit.nl/api}"   # relative to the remote home directory
HEALTH_URL="${DEPLOY_HEALTH_URL:-https://arjensmit.nl/api/health}"

cd "$(dirname "$0")/.."

npm run validate
npm run build

# Only runtime files travel. Everything else on the server (node_modules symlink, tmp/,
# .htaccess, .env) is excluded and therefore never deleted by --delete.
rsync -az --delete --itemize-changes \
  --include='/app.js' \
  --include='/package.json' \
  --include='/package-lock.json' \
  --include='/dist/***' \
  --include='/data/***' \
  --exclude='*' \
  ./ "${HOST}:${APP_ROOT}/"

ssh "${HOST}" "
  set -e
  /usr/sbin/cloudlinux-selector install-modules --json --interpreter nodejs --app-root '${APP_ROOT}' >/dev/null
  /usr/sbin/cloudlinux-selector restart --json --interpreter nodejs --app-root '${APP_ROOT}' >/dev/null
"

echo "Deployed. Probing ${HEALTH_URL} ..."
curl --fail --silent --show-error "${HEALTH_URL}"
echo
