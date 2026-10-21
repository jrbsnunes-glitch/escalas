#!/bin/sh
set -eu

mkdir -p /app/data /app/data/escalas /app/data/tmp-uploads

if [ "${RESET_DB:-0}" = "1" ]; then
  echo "Recriando o banco de desenvolvimento..."
  npx prisma db push --force-reset --accept-data-loss
  npx tsx prisma/seed.ts
else
  npx prisma db push
  COUNT="$(node -e "const {PrismaClient}=require('@prisma/client'); const p=new PrismaClient(); p.integrante.count().then((c)=>{console.log(c); return p.\$disconnect();}).catch(()=>{console.log(0); process.exit(0);})")"
  if [ "$COUNT" = "0" ]; then
    echo "Banco vazio: aplicando seed..."
    npx tsx prisma/seed.ts
  fi
fi

exec "$@"
