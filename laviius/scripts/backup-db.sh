#!/usr/bin/env bash
# Manual/scheduled logical backup of the Laviius Supabase Postgres database.
#
# This is layer 2 of the three-layer backup strategy in docs/RUNBOOK-RESTORE.md
# (code / database / files). Supabase's own Point-in-Time Recovery (paid tier)
# is the primary safety net; this script is the independent second copy that
# protects against account-level incidents (e.g. losing access to the
# Supabase project itself), so its output must land in storage that is NOT
# the same Supabase project — see the upload step below.
#
# Intended to run both locally (manual trigger) and from the scheduled
# GitHub Actions workflow (.github/workflows/db-backup.yml). Requires:
#   - SUPABASE_DB_URL      Postgres connection string (session pooler, not
#                          the pooled transaction-mode port — pg_dump needs
#                          a direct/session connection).
#   - BACKUP_BUCKET        Destination bucket name in the off-platform
#                          object store (e.g. an S3/R2/GCS bucket, NOT a
#                          Supabase Storage bucket in the same project).
#   - AWS CLI (or equivalent) configured with credentials that can write to
#                          BACKUP_BUCKET, if using S3-compatible storage.
#
# Usage: ./scripts/backup-db.sh

set -euo pipefail

: "${SUPABASE_DB_URL:?SUPABASE_DB_URL is not set. See .env.example.}"
: "${BACKUP_BUCKET:?BACKUP_BUCKET is not set. See .env.example.}"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_dir="$(mktemp -d)"
backup_file="${backup_dir}/laviius-db-${timestamp}.dump"

cleanup() {
  rm -rf "${backup_dir}"
}
trap cleanup EXIT

echo "Dumping database to ${backup_file}..."
pg_dump "${SUPABASE_DB_URL}" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="${backup_file}"

echo "Uploading to s3://${BACKUP_BUCKET}/db-backups/${timestamp}/..."
aws s3 cp "${backup_file}" "s3://${BACKUP_BUCKET}/db-backups/${timestamp}/laviius-db-${timestamp}.dump"

echo "Backup complete: ${timestamp}"
echo "Restore with: pg_restore --clean --if-exists --no-owner --dbname=\"\$SUPABASE_DB_URL\" <downloaded-file>"
echo "Full restore procedure: docs/RUNBOOK-RESTORE.md"
