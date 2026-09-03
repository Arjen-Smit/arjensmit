#!/usr/bin/env bash
set -euo pipefail

# Load .env from the project root
ENV_FILE="$(dirname "$0")/../.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "Missing .env file at $ENV_FILE" >&2
  exit 1
fi
set -a
source "$ENV_FILE"
set +a

CA_FILE="$(cd "$(dirname "$0")/.." && pwd)/certs/ftp-ca-bundle.pem"
if [ ! -f "$CA_FILE" ]; then
  echo "Missing CA bundle at $CA_FILE" >&2
  exit 1
fi

for var in FTP_HOST FTP_USER FTP_PASS FTP_REMOTE_DIR LOCAL_DIR; do
  if [ -z "${!var:-}" ]; then
    echo "Missing value for $var in $ENV_FILE" >&2
    exit 1
  fi
done

# Pass --dry-run as first argument to preview without changing anything
DRY_RUN="${1:-}"

LFTP_PASSWORD="$FTP_PASS" lftp --env-password -u "$FTP_USER" "$FTP_HOST" <<EOF | sed -E "s|(ftp://[^:@/]+:)[^@]*@|\1***@|g"
set ftp:ssl-force true
set ssl:ca-file "$CA_FILE"
set ssl:verify-certificate yes
mirror -R --delete --only-newer --verbose $DRY_RUN \
  --exclude-glob .git/ \
  --exclude .env \
  "$LOCAL_DIR" "$FTP_REMOTE_DIR"
quit
EOF
