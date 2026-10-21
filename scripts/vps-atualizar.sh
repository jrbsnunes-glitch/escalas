#!/usr/bin/env bash
# Sempre o mesmo roteiro no VPS. Nao pule etapas.
set -euo pipefail
cd /opt/escalas

echo "=== antes ==="
git log -1 --oneline

git fetch origin
git checkout main
git reset --hard origin/main

echo "=== codigo atual ==="
git log -1 --oneline

npx prisma db push
npm ci
npm run build
pm2 restart escalas

echo "=== pronto ==="
git log -1 --oneline
pm2 show escalas | grep -E "status|exec cwd" || true
