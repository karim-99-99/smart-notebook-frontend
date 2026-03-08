#!/bin/bash
# Complete cleanup script for smart-notebook containers

echo "🧹 Cleaning up ALL smart-notebook containers..."

# Remove by name
docker rm -f sn_postgres sn_backend sn_ocr_service 2>/dev/null

# Remove by any remaining IDs
docker rm -f 9101876bad33029024d0a953814759b6867b8cda3ef2fcbd30028e5080a18b57 2>/dev/null

# Docker compose down
docker compose down 2>/dev/null

# Remove all stopped containers
docker container prune -f

echo "✅ Complete cleanup done!"
echo ""
echo "Now run: docker compose up"
