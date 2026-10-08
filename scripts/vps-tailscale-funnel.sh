#!/usr/bin/env bash
# Volta o acesso público na porta 10000 (como antes).
# Celular e PC abrem https://srv2007117.tailab8ad4.ts.net:10000 sem o app Tailscale.
# A 8443 não é usada. O Next.js continua na 3000.
set -euo pipefail

cd /opt/escalas

echo "=== app interno na 3000 ==="
curl -sI --max-time 5 http://127.0.0.1:3000/login | head -n 5

echo "=== Tailscale Funnel HTTPS 10000 -> 3000 ==="
tailscale serve --https=10000 off || true
tailscale serve reset || true
tailscale funnel reset || true
tailscale funnel --bg --https=10000 http://127.0.0.1:3000
tailscale funnel status

echo
echo "URL pública: https://srv2007117.tailab8ad4.ts.net:10000"
echo "Não precisa do app Tailscale no celular."
