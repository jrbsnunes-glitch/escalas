import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "./prisma";
import { apagarPastaEscala } from "./arquivo-escala";
import { COOKIE_FUSO, fusoDeCookie, partesHoje, ymdDeData } from "./datas";

const FUSO_PADRAO = "America/Manaus";
const INTERVALO_MS = 20 * 60 * 1000;
const TRAVA = path.join(process.cwd(), ".limpeza-arquivos.json");
const PASTA_REPERTORIO = path.join(process.cwd(), "public", "repertorio");

export function fusoLimpeza(cookie?: string | null) {
  return fusoDeCookie(cookie ?? undefined) ?? FUSO_PADRAO;
}

export { COOKIE_FUSO };

async function podeRodar() {
  try {
    const bruto = await readFile(TRAVA, "utf8");
    const { em } = JSON.parse(bruto) as { em?: number };
    if (em && Date.now() - em < INTERVALO_MS) return false;
  } catch {
    /* sem trava */
  }
  await writeFile(TRAVA, JSON.stringify({ em: Date.now() }));
  return true;
}

async function limparRepertorioAntigo() {
  await rm(PASTA_REPERTORIO, { recursive: true, force: true });
}

export async function limparArquivosEscalasVencidas(fusoCookie?: string | null) {
  if (!(await podeRodar())) return;
  const hoje = partesHoje(new Date(), fusoLimpeza(fusoCookie)).ymd;

  const escalas = await prisma.escala.findMany({
    where: { arquivos: { some: {} } },
    select: { id: true, data: true },
  });

  for (const escala of escalas) {
    if (ymdDeData(escala.data) >= hoje) continue;
    await apagarPastaEscala(escala.id);
    await prisma.arquivoEscala.deleteMany({ where: { escalaId: escala.id } });
  }

  await limparRepertorioAntigo();
}

export function dispararLimpezaArquivos(fusoCookie?: string | null) {
  void limparArquivosEscalasVencidas(fusoCookie).catch(() => undefined);
}
