#!/usr/bin/env bash
# Syncs the Supabase Storage bucket (shipment photos/documents) to an
# off-platform object store. This is layer 3 of the backup strategy in
# docs/RUNBOOK-RESTORE.md — Storage is NOT covered by database
# backups/PITR, so it needs its own independent export.
#
# Requires:
#   - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  to list/download bucket objects
#   - BACKUP_BUCKET                            destination bucket, off-platform
#   - rclone (https://rclone.org) configured with a remote named "supabase"
#     pointed at the project's S3-compatible Storage endpoint, and a remote
#     named "backup" pointed at BACKUP_BUCKET. Supabase Storage exposes an
#     S3-compatible API — see Supabase dashboard > Storage > S3 connection.
#
# Usage: ./scripts/sync-storage.sh

set -euo pipefail

: "${BACKUP_BUCKET:?BACKUP_BUCKET is not set. See .env.example.}"

echo "Syncing Supabase Storage -> s3://${BACKUP_BUCKET}/storage-backups/..."
rclone sync supabase:shipment-files "backup:${BACKUP_BUCKET}/storage-backups/latest" \
  --fast-list \
  --transfers=8 \
  --checkers=8

echo "Storage sync complete."
echo "Full restore procedure: docs/RUNBOOK-RESTORE.md"
