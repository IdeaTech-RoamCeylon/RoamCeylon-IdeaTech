#!/usr/bin/env bash
# apps/backend/scripts/db-restore.sh
#
# PostgreSQL restore script — Day 67 Task 3 (Backup & Recovery Plan)
#
# Restores the database from a pg_dump custom-format backup file.
#
# ⚠️  WARNING: This drops and recreates the public schema.
#               ALL existing data will be lost. Use with extreme caution.
#
# Usage:
#   bash scripts/db-restore.sh ./backups/backup_2026-05-20_12-00-00.dump
#
# Environment variables:
#   DATABASE_URL — PostgreSQL connection string (required, from .env)

set -euo pipefail

LOG_PREFIX="[db-restore]"

# ─── Args ─────────────────────────────────────────────────────────────────────

if [ $# -lt 1 ]; then
  echo "$LOG_PREFIX Usage: bash scripts/db-restore.sh <backup_file.dump>"
  exit 1
fi

BACKUP_FILE="$1"

# ─── Validate backup file ─────────────────────────────────────────────────────

if [ ! -f "$BACKUP_FILE" ]; then
  echo "$LOG_PREFIX ❌ Backup file not found: $BACKUP_FILE"
  exit 1
fi

if [ ! -s "$BACKUP_FILE" ]; then
  echo "$LOG_PREFIX ❌ Backup file is empty: $BACKUP_FILE"
  exit 1
fi

BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "$LOG_PREFIX Backup file: $BACKUP_FILE ($BACKUP_SIZE)"

# ─── Load DATABASE_URL ────────────────────────────────────────────────────────

if [ -z "${DATABASE_URL:-}" ]; then
  ENV_FILE="$(dirname "$0")/../.env"
  if [ -f "$ENV_FILE" ]; then
    # shellcheck disable=SC1090
    set -a && source "$ENV_FILE" && set +a
  fi
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "$LOG_PREFIX ❌ DATABASE_URL is not set. Load .env or set the variable."
  exit 1
fi

# ─── Confirmation prompt ──────────────────────────────────────────────────────

echo ""
echo "$LOG_PREFIX ⚠️  WARNING: This will DROP and RECREATE the database schema."
echo "$LOG_PREFIX    DATABASE_URL: ${DATABASE_URL%%@*}@***"
echo "$LOG_PREFIX    Backup:       $BACKUP_FILE"
echo ""
read -rp "$LOG_PREFIX Type 'yes' to confirm: " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "$LOG_PREFIX Aborted."
  exit 0
fi

# ─── Drop and recreate schema ─────────────────────────────────────────────────

echo "$LOG_PREFIX Dropping public schema..."
psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" 2>&1

echo "$LOG_PREFIX Schema cleared."

# ─── Restore from backup ──────────────────────────────────────────────────────

echo "$LOG_PREFIX Starting restore at $(date -u '+%Y-%m-%dT%H:%M:%SZ')..."

pg_restore \
  --no-password \
  --verbose \
  --clean \
  --if-exists \
  --dbname="$DATABASE_URL" \
  "$BACKUP_FILE" 2>&1

echo "$LOG_PREFIX ✅ Restore completed at $(date -u '+%Y-%m-%dT%H:%M:%SZ')"

# ─── Post-restore verification ────────────────────────────────────────────────

echo "$LOG_PREFIX Verifying row counts..."

psql "$DATABASE_URL" -c "
  SELECT table_name, (xpath('/row/count/text()', query_to_xml(
    'SELECT COUNT(*) FROM \"' || table_name || '\"', true, true, ''
  )))[1]::text::int AS row_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
  ORDER BY table_name;
" 2>&1

echo "$LOG_PREFIX ✅ Restore verification complete"
echo "$LOG_PREFIX ✅ Done — database has been restored from $BACKUP_FILE"
