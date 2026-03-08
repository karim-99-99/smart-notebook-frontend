#!/bin/bash
# Cleanup script to remove conflicting containers

echo "🧹 Cleaning up containers..."

# Stop and remove all smart-notebook containers
docker stop sn_postgres sn_backend sn_ocr_service 2>/dev/null
docker rm sn_postgres sn_backend sn_ocr_service 2>/dev/null

# Try to remove by the specific ID if it exists
docker rm -f 1555033607bd666707f489281fe1a75f15340fb3a8cbe97bff08cee4a674a52f 2>/dev/null

# Also try docker compose down to clean up
docker compose down 2>/dev/null

echo "✅ Cleanup complete! You can now run: docker compose up"
