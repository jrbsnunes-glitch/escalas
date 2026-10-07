// Next.js: porta 3000. Público Tailscale: HTTPS 10000 (não usar 8443).
// scripts/vps-tailscale-serve.sh  →  serve --https=10000 → 127.0.0.1:3000
// Não misture Serve e Funnel na 10000.
module.exports = {
  apps: [
    {
      name: "escalas",
      cwd: "/opt/escalas",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 0.0.0.0 -p 3000",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};
