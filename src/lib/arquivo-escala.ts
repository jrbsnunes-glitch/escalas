import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  EXTENSOES_ARQUIVO,
  extensaoArquivo,
  nomeArquivoSeguro,
} from "./musica";

/** Pasta antiga (colidia com a rota /escalas/[id]). */
export const PASTA_ESCALAS_PUBLICA = path.join(process.cwd(), "public", "escalas");
/** Pasta atual, fora das rotas da App Router. */
export const PASTA_ESCALAS = path.join(process.cwd(), "data", "escalas");

export function pastaEscala(escalaId: string) {
  return path.join(PASTA_ESCALAS, escalaId);
}

export function caminhoLogico(escalaId: string, nomeArquivo: string) {
  return `/escalas/${escalaId}/${nomeArquivo}`;
}

export function caminhoPublico(escalaId: string, nomeArquivo: string) {
  return caminhoLogico(escalaId, nomeArquivo);
}

export function urlDownloadArquivo(escalaId: string, arquivoId: string) {
  return `/api/escalas/${escalaId}/arquivo/${arquivoId}`;
}

export function mimeArquivo(nome: string) {
  switch (extensaoArquivo(nome)) {
    case "mp3":
      return "audio/mpeg";
    case "m4a":
      return "audio/mp4";
    case "wav":
      return "audio/wav";
    case "ogg":
      return "audio/ogg";
    case "pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
}

export async function localizarArquivoNoDisco(arquivo: {
  path: string;
  escalaId: string;
}) {
  const nome = path.basename(arquivo.path);
  const candidatos = [
    path.join(process.cwd(), "data", "escalas", arquivo.escalaId, nome),
    path.join(process.cwd(), "public", "escalas", arquivo.escalaId, nome),
  ];
  for (const candidato of candidatos) {
    try {
      await access(/* turbopackIgnore: true */ candidato);
      return candidato;
    } catch {
      /* tenta o próximo */
    }
  }
  return null;
}

export async function lerArquivoEscala(arquivo: { path: string; escalaId: string }) {
  const disco = await localizarArquivoNoDisco(arquivo);
  if (!disco) return null;
  return {
    disco,
    buffer: await readFile(/* turbopackIgnore: true */ disco),
  };
}

export async function apagarPastaEscala(escalaId: string) {
  await rm(pastaEscala(escalaId), { recursive: true, force: true });
  await rm(path.join(PASTA_ESCALAS_PUBLICA, escalaId), {
    recursive: true,
    force: true,
  });
}

export type EnvioArquivoEscala = {
  file: File;
  musicaId: string | null;
};

export async function gravarArquivosEscala(
  escalaId: string,
  enviados: EnvioArquivoEscala[],
  ordemInicial: number,
) {
  const pasta = pastaEscala(escalaId);
  await mkdir(pasta, { recursive: true });

  const criados: {
    nome: string;
    path: string;
    ordem: number;
    musicaId: string | null;
  }[] = [];
  let ordem = ordemInicial;
  const stamp = Date.now();

  for (const [indice, envio] of enviados.entries()) {
    const arquivo = envio.file;
    const ext = extensaoArquivo(arquivo.name);
    if (!EXTENSOES_ARQUIVO.has(ext)) {
      throw new Error("Use arquivos mp3, m4a, wav, ogg ou PDF.");
    }
    const nomeOriginal =
      ext === "pdf"
        ? nomeArquivoSeguro(arquivo.name).replace(/\.pdf$/i, "") + ".pdf"
        : arquivo.name;
    const tipo = ext === "pdf" ? "pdf" : "audio";
    const discoNome = `${stamp}-${tipo}-${indice}-${nomeArquivoSeguro(nomeOriginal)}`;
    await writeFile(
      path.join(pasta, discoNome),
      Buffer.from(await arquivo.arrayBuffer()),
    );
    criados.push({
      nome: nomeOriginal,
      path: caminhoLogico(escalaId, discoNome),
      ordem: ordem++,
      musicaId: envio.musicaId,
    });
  }

  return criados;
}
