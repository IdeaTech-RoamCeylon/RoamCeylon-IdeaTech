#!/usr/bin/env bash
# apps/backend/scripts/db-backup.sh
#
# PostgreSQL backup script — Day 67 Task 3 (Backup & Recovery Plan)
#
# Produces a timestamped compressed backup using pg_dump custom format.
# Safe to run while the server is live (no table locks for SELECT workloads).
#
# Usage:
#   bash scripts/db-backup.sh
#   BACKUP_DIR=/mnt/backups bash scripts/db-backup.sh
#
# Environment variables:
#   DATABASE_URL   — PostgreSQL connection string (required, from .env)
#   BACKUP_DIR     — Directory to save backups (default: ./backups)
#   RETAIN_DAYS    — Delete backups older than N days (default: 7)

set -euo pipefail

# ─── Config ───────────────────────────────────────────────────────────────────

BACKUP_DIR="${BACKUP_DIR:-$(dirname "$0")/../backups}"
RETAIN_DAYS="${RETAIN_DAYS:-7}"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.dump"
LOG_PREFIX="[db-backup]"

# ─── Resolve connection from DATABASE_URL ────────────────────────────────────

if [ -z "${DATABASE_URL:-}" ]; then
  # Try loading from .env
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

# ─── Prepare backup directory ─────────────────────────────────────────────────

mkdir -p "$BACKUP_DIR"
echo "$LOG_PREFIX ✅ Backup directory: $BACKUP_DIR"

# ─── Run pg_dump ──────────────────────────────────────────────────────────────

echo "$LOG_PREFIX Starting backup at $(date -u '+%Y-%m-%dT%H:%M:%SZ')..."
echo "$LOG_PREFIX Output: $BACKUP_FILE"

pg_dump \
  --format=custom \
  --compress=9 \
  --no-password \
  --verbose \
  "$DATABASE_URL" \
  > "$BACKUP_FILE" 2>&1

# ─── Verify & report size ─────────────────────────────────────────────────────

if [ ! -f "$BACKUP_FILE" ] || [ ! -s "$BACKUP_FILE" ]; then
  echo "$LOG_PREFIX ❌ Backup file is missing or empty — something went wrong"
  exit 1
fi

BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "$LOG_PREFIX ✅ Backup completed at $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "$LOG_PREFIX    File: $BACKUP_FILE"
echo "$LOG_PREFIX    Size: $BACKUP_SIZE"

# ─── Rotate old backups ───────────────────────────────────────────────────────

echo "$LOG_PREFIX Rotating backups older than ${RETAIN_DAYS} days..."
DELETED=$(find "$BACKUP_DIR" -name "backup_*.dump" -mtime +"$RETAIN_DAYS" -print -delete | wc -l | tr -d ' ')
echo "$LOG_PREFIX    Deleted $DELETED old backup(s)"

# ─── List remaining backups ───────────────────────────────────────────────────

echo "$LOG_PREFIX Current backups:"
ls -lh "$BACKUP_DIR"/backup_*.dump 2>/dev/null || echo "$LOG_PREFIX    (none)"

echo "$LOG_PREFIX ✅ Done"
