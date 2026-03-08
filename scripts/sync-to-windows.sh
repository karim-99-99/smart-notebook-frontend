#!/usr/bin/env bash
# Sync full mobile project from WSL to Windows (make both versions identical)
# Run from WSL: cd /home/karim/smart-notebook/mobile && ./scripts/sync-to-windows.sh
set -e
SRC="/home/karim/smart-notebook/mobile"
DST="/mnt/c/Users/DELL/SmartNotebook/mobile"
mkdir -p "$DST"
rsync -av --delete \
  --exclude=node_modules --exclude=.gradle --exclude=build --exclude=.expo --exclude=dist --exclude=.git \
  "$SRC/" "$DST/"
echo "Sync complete. WSL and Windows mobile are in sync."
