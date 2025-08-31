#!/usr/bin/env bash
set -euo pipefail

# Config
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$BASE_DIR/backups}"
KV_SQLITE_PATH="${KV_SQLITE_PATH:-$BASE_DIR/data.sqlite}"
FILES_DIR="${FILES_DIR:-$BASE_DIR/files}"
TS="$(date +%Y%m%d-%H%M%S)"
DEST_DIR="$BACKUP_DIR/$TS"
mkdir -p "$DEST_DIR"

# 1) SQLite backup (consistent)
if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$KV_SQLITE_PATH" ".backup '$DEST_DIR/data.sqlite'"
else
  cp -a "$KV_SQLITE_PATH" "$DEST_DIR/data.sqlite"
fi

# 2) Files archive (compressed)
if [ -d "$FILES_DIR" ]; then
  tar -C "$FILES_DIR" -czf "$DEST_DIR/files.tar.gz" .
else
  echo "WARN: files dir '$FILES_DIR' not found" >&2
fi

# 3) Create top-level archive for portability
ARCHIVE="$BACKUP_DIR/mirrorcrm-backup-$TS.tar.gz"
tar -C "$BACKUP_DIR" -czf "$ARCHIVE" "$TS"
rm -rf "$DEST_DIR"

echo "Backup created: $ARCHIVE"
