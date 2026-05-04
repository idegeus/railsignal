#!/usr/bin/env bash
# Dumps Postgres and uploads to Hetzner Object Storage.
# Run via cron: 0 3 * * * /path/to/backup.sh >> /var/log/railsignal-backup.log 2>&1
set -euo pipefail

source "$(dirname "$0")/.env" 2>/dev/null || true

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DUMP_FILE="/tmp/railsignal_${TIMESTAMP}.dump"

echo "[${TIMESTAMP}] Starting backup"

docker compose -f "$(dirname "$0")/docker-compose.prod.yml" --env-file "$(dirname "$0")/.env" \
  exec -T db pg_dump -U "${POSTGRES_USER}" -Fc "${POSTGRES_DB}" > "${DUMP_FILE}"

# Upload to Hetzner Object Storage (S3-compatible)
AWS_ACCESS_KEY_ID="${HETZNER_S3_ACCESS_KEY}" \
AWS_SECRET_ACCESS_KEY="${HETZNER_S3_SECRET_KEY}" \
aws s3 cp "${DUMP_FILE}" \
  "s3://${HETZNER_S3_BUCKET}/postgres/${TIMESTAMP}.dump" \
  --endpoint-url "${HETZNER_S3_ENDPOINT}"

rm -f "${DUMP_FILE}"

# Prune backups older than 30 days
AWS_ACCESS_KEY_ID="${HETZNER_S3_ACCESS_KEY}" \
AWS_SECRET_ACCESS_KEY="${HETZNER_S3_SECRET_KEY}" \
aws s3 ls "s3://${HETZNER_S3_BUCKET}/postgres/" \
  --endpoint-url "${HETZNER_S3_ENDPOINT}" \
  | awk '{print $4}' \
  | while read -r key; do
      date_str=$(echo "$key" | cut -c1-8)
      if [[ $(date -d "${date_str}" +%s 2>/dev/null || date -j -f "%Y%m%d" "${date_str}" +%s) -lt $(date -d "30 days ago" +%s 2>/dev/null || date -v-30d +%s) ]]; then
        AWS_ACCESS_KEY_ID="${HETZNER_S3_ACCESS_KEY}" \
        AWS_SECRET_ACCESS_KEY="${HETZNER_S3_SECRET_KEY}" \
        aws s3 rm "s3://${HETZNER_S3_BUCKET}/postgres/${key}" \
          --endpoint-url "${HETZNER_S3_ENDPOINT}"
        echo "Pruned: ${key}"
      fi
    done

echo "[$(date +%Y%m%d_%H%M%S)] Backup complete"
