FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .

ENV NODE_ENV=production \
    DATABASE_URL=file:/app/data/dev.db \
    AUTH_COOKIE=escalas_session \
    PORT=3000

RUN mkdir -p /app/data \
  && npx prisma generate \
  && npm run build \
  && sed -i 's/\r$//' scripts/docker-entrypoint.sh \
  && chmod +x scripts/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["scripts/docker-entrypoint.sh"]
CMD ["npm", "start"]
