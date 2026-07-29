# Restore Runbook

This is the step-by-step recovery procedure for Laviius's code, database,
and file storage. It's written for someone with no prior context — a future
you six months from now, or a contractor brought in during an incident.
Read the whole thing once, calmly, before you need it under pressure.

Laviius backs up three things **independently**, because they fail
independently: a bad deploy doesn't touch the database; a bad migration
doesn't touch Storage; losing Supabase account access doesn't touch GitHub.

## Before anything: figure out what actually broke

| Symptom                                              | Likely layer | Go to           |
| ----------------------------------------------------- | ------------ | --------------- |
| Site is broken/down after a deploy, data looks fine   | Code         | [Code](#1-code-restore-github--vercel) |
| Data is wrong/missing, site itself loads fine          | Database     | [Database](#2-database-restore) |
| Shipment photos/documents are missing or 404           | File storage | [File storage](#3-file-storage-restore) |
| Can't log into Vercel/Supabase at all                  | Account access | [Account-level loss](#4-account-level-loss) |

If you're not sure, start with the **Deployments tab in Vercel** — it's the
lowest-risk, fastest check, and often the actual fix (see below).

## 1. Code restore (GitHub + Vercel)

GitHub is the backup for code. There is no separate "code backup" step to
run — every push is already the backup, plus branch protection on `main`
(PR + review required) prevents most bad-code incidents from reaching
production silently.

### Fastest fix: roll back the deployment, not the code

Vercel keeps every previous deployment. If the current production
deployment is broken:

1. Open the Laviius project in the Vercel dashboard → **Deployments** tab.
2. Find the last deployment you know was good (check the commit message /
   timestamp).
3. Click the **⋯** menu on that deployment → **Promote to Production**.
4. Confirm. This is instant — no rebuild, no code changes — and the site
   is back on the known-good version immediately.
5. Once things are stable, go fix the actual bug in a new PR. Don't
   panic-edit `main` directly.

### If you need the code itself (e.g. rebuilding from scratch)

```bash
git clone https://github.com/ChieStevedor/Cavari.git
cd Cavari/laviius
```

Every tagged production release is available via `git tag --list` /
`git checkout <tag>` if you need to reconstruct a specific point in time
rather than just the latest `main`.

## 2. Database restore

Two independent safety nets exist. Try them in this order.

### Option A: Supabase Point-in-Time Recovery (PITR) — primary, fastest

Requires the Supabase project to be on a paid tier with PITR enabled.

1. Log into the Supabase dashboard → the Laviius project → **Database** →
   **Backups**.
2. Choose **Point in Time Recovery**, pick a timestamp just before the
   incident.
3. Follow Supabase's restore flow. This typically restores into a new
   project or a branch — read the on-screen instructions carefully, since
   the exact flow changes between Supabase dashboard versions.
4. Once restored, verify row counts / spot-check a few known records before
   pointing the app at the restored database (update `SUPABASE_DB_URL` /
   `NEXT_PUBLIC_SUPABASE_URL` in Vercel env vars if it's a new project).

### Option B: Scheduled pg_dump — independent second copy

This exists specifically to protect against **losing access to the
Supabase account itself**, not just data corruption. It runs daily via
`.github/workflows/laviius-db-backup.yml` (calls `scripts/backup-db.sh`)
and lands in an off-platform bucket (`BACKUP_BUCKET`, not a Supabase
project).

To restore from a dump:

1. Find the backup you want in the `BACKUP_BUCKET` bucket, under
   `db-backups/<timestamp>/laviius-db-<timestamp>.dump`. List them with:
   ```bash
   aws s3 ls s3://$BACKUP_BUCKET/db-backups/
   ```
2. Download it:
   ```bash
   aws s3 cp s3://$BACKUP_BUCKET/db-backups/<timestamp>/laviius-db-<timestamp>.dump ./restore.dump
   ```
3. Restore into a **new, empty** Supabase project first — never restore
   directly on top of a live project you might still need:
   ```bash
   pg_restore --clean --if-exists --no-owner --dbname="$SUPABASE_DB_URL" ./restore.dump
   ```
4. Verify the restored data, then either re-point the app at this project
   (update env vars) or, if the original project is still usable, use this
   only to recover specific rows/tables.
5. **Re-apply migrations that happened after this dump's timestamp**, if
   any (`supabase/migrations/*.sql`, in filename order) — a pg_dump only
   captures data as of the moment it ran, not anything after.

### Testing this procedure

Do a full restore-to-a-scratch-project dry run **quarterly**. A backup
that has never been restored is not a backup — dump format changes,
credential rot, and silent cron failures are all things you only discover
by actually running Option B end-to-end. Note the date of the last
successful test in the secrets vault (see `SECURITY.md`) alongside the
backup credentials, so it's easy to check when the next one is due.

## 3. File storage restore

Supabase Storage (shipment photos/documents in the `shipment-files` bucket)
is **not** covered by database backups or PITR — it needs its own
independent restore path.

1. `scripts/sync-storage.sh` runs daily (via the same
   `laviius-db-backup.yml` workflow) and mirrors the bucket to
   `s3://$BACKUP_BUCKET/storage-backups/latest/` using `rclone`.
2. To restore, sync back in the opposite direction:
   ```bash
   rclone sync "backup:$BACKUP_BUCKET/storage-backups/latest" supabase:shipment-files \
     --fast-list --transfers=8 --checkers=8
   ```
   (Requires the same `rclone` remotes configured as in
   `scripts/sync-storage.sh` — a "supabase" remote pointed at the
   project's S3-compatible Storage endpoint, and a "backup" remote pointed
   at `BACKUP_BUCKET`.)
3. Spot-check a few `shipment_files.storage_path` values against the
   restored bucket to confirm objects landed correctly before considering
   this done.
4. If only specific files are missing (not the whole bucket), you can
   `rclone copy` individual paths instead of a full sync.

## 4. Account-level loss

If you lose access to the Vercel account, the GitHub org, or the Supabase
account entirely (not just a data incident):

1. **Code** is unaffected — it's on GitHub under a separate account/org
   from Vercel/Supabase. Re-create the Vercel project from the repo
   following the checklist in `/DEPLOYMENT.md` at the repo root.
2. **Database**: create a new Supabase project, run
   `supabase/migrations/*.sql` in order to recreate the schema, then
   restore data using Option B above (the off-platform pg_dump — this is
   exactly the scenario it exists for, since Option A/PITR lives inside
   the Supabase account you just lost access to).
3. **File storage**: create the `shipment-files` bucket in the new
   Supabase project, then restore from the off-platform sync per
   [File storage restore](#3-file-storage-restore) above.
4. **Secrets**: pull fresh values for every variable in `.env.example` from
   the secrets vault (see `SECURITY.md`, "Secrets management") and set them
   in the new Vercel/Supabase projects. Rotate anything you have reason to
   believe was exposed as part of losing access.

## Secrets vault

`SECURITY.md` requires a master copy of all secrets kept outside of
Vercel/Supabase (e.g. a password manager vault) specifically so this
runbook is executable even if platform access is lost. That vault should
contain, at minimum, one entry per variable in `.env.example`, plus:

- The `BACKUP_BUCKET` provider's account credentials (separate from the
  `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` used day-to-day, if your
  provider supports scoped vs. root credentials)
- The date of the last successful quarterly restore test

This runbook intentionally contains **no actual secret values** — only
where to find them and how to use them once retrieved.
