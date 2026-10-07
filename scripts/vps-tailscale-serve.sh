#!/usr/bin/env bash
# O Next.js escuta só em 127.0.0.1:3000 (PM2).
# Quem abre o site usa HTTPS na porta 10000 do Tailscale
# (https://srv2007117.tailab8ad4.ts.net:10000).
# A 8443 não é usada.
set -euo pipefail

cd /opt/escalas

echo "=== commit ==="
git log -1 --oneline

echo "=== app interno na 3000 ==="
curl -sI --max-time 5 http://127.0.0.1:3000/login | head -n 5

echo "=== pasta dos MP3 ==="
mkdir -p /opt/escalas/data/escalas /opt/escalas/data/tmp-uploads
chmod -R u+rwX /opt/escalas/data

echo "=== Tailscale HTTPS 10000 -> 3000 (Serve, sem Funnel) ==="
tailscale funnel reset || true
tailscale serve reset || true
tailscale serve --bg --https=10000 http://127.0.0.1:3000
tailscale serve status

echo
echo "URL: https://$(hostname).tailab8ad4.ts.net:10000"
echo "Celular e PC precisam do app Tailscale."
echo "Se algum membro NÃO tiver Tailscale, use scripts/nginx-escalas.conf.example"
echo "com um domínio próprio (client_max_body_size 30M) e deixe o Tailscale só para SSH."
