#!/usr/bin/env bash
# Confere se o SQLite do Escalas existe e pode ser aberto pelo PM2.
set -euo pipefail
cd /opt/escalas

echo "=== DATABASE_URL ==="
grep -E '^DATABASE_URL=' .env || echo "DATABASE_URL ausente no .env"

echo "=== arquivos sqlite ==="
ls -la prisma/*.db prisma/*.db-journal prisma/*.db-wal prisma/*.db-shm 2>/dev/null || echo "Nenhum .db em prisma/"

echo "=== permissao ==="
chmod u+rwx prisma
chmod u+rw prisma/*.db prisma/*.db-* 2>/dev/null || true

echo "=== pm2 cwd ==="
pm2 show escalas | grep -E "exec cwd|script path|status" || true

echo
echo "Se o .db existir, rode: pm2 restart escalas"
echo "Se NAO existir, o banco foi perdido — restaure o backup. Nao rode seed (apaga usuarios)."
