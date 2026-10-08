import { accessSync, constants } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

function resolverDatabaseUrl() {
  const bruto = process.env.DATABASE_URL ?? "file:./dev.db";
  if (!bruto.startsWith("file:")) return;
  let arquivo = bruto.slice("file:".length);
  if (arquivo.startsWith("/app/")) {
    arquivo = path.join(process.cwd(), arquivo.slice("/app/".length));
  }
  if (path.isAbsolute(arquivo)) {
    process.env.DATABASE_URL = `file:${arquivo}`;
    return;
  }
  const nome = path.basename(arquivo);
  const candidatos = [
    path.resolve(process.cwd(), arquivo),
    path.resolve(process.cwd(), "prisma", arquivo),
    path.resolve(process.cwd(), "prisma", nome),
  ];
  for (const candidato of candidatos) {
    try {
      accessSync(/* turbopackIgnore: true */ candidato, constants.R_OK);
      process.env.DATABASE_URL = `file:${candidato}`;
      return;
    } catch {
      /* tenta o próximo */
    }
  }
  process.env.DATABASE_URL = `file:${path.resolve(process.cwd(), "prisma", nome)}`;
}

resolverDatabaseUrl();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
