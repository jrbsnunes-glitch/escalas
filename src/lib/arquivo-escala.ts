import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  EXTENSOES_ARQUIVO,
  extensaoArquivo,
  nomeArquivoSeguro,
} from "./musica";

/** Pasta antiga (colidia com a rota /escalas/[id]). */
export const PASTA_ESCALAS_PUBLICA = path.join(
  process.cwd(),
  "public",
  "escalas",
);
/** Pasta estável no VPS (gravável junto com o app). */
export const PASTA_ESCALAS_UPLOAD = path.join(
  process.cwd(),
  "public",
  "uploads",
  "escalas",
);
/** Pasta alternativa fora de public. */
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
    path.join(process.cwd(), "public", "uploads", "escalas", arquivo.escalaId, nome),
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
  await rm(path.join(PASTA_ESCALAS_UPLOAD, escalaId), {
    recursive: true,
    force: true,
  });
  await rm(pastaEscala(escalaId), { recursive: true, force: true });
  await rm(path.join(PASTA_ESCALAS_PUBLICA, escalaId), {
    recursive: true,
    force: true,
  });
}

export function idUploadSeguro(valor: string) {
  const limpo = valor.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!limpo || limpo.length > 80) {
    throw new Error("Identificador de envio inválido.");
  }
  return limpo;
}

export async function gravarPedacoUpload(
  uploadId: string,
  indice: number,
  buffer: Buffer,
) {
  const pasta = path.join(
    process.cwd(),
    "data",
    "tmp-uploads",
    idUploadSeguro(uploadId),
  );
  await mkdir(pasta, { recursive: true });
  await writeFile(path.join(pasta, `${indice}.part`), buffer);
}

export async function montarPedacosUpload(uploadId: string, total: number) {
  const pasta = path.join(
    process.cwd(),
    "data",
    "tmp-uploads",
    idUploadSeguro(uploadId),
  );
  const partes: Buffer[] = [];
  for (let indice = 0; indice < total; indice++) {
    partes.push(await readFile(path.join(pasta, `${indice}.part`)));
  }
  await rm(pasta, { recursive: true, force: true });
  return Buffer.concat(partes);
}

export async function pastaGravacaoEscala(escalaId: string) {
  const preferida = path.join(PASTA_ESCALAS_UPLOAD, escalaId);
  try {
    await mkdir(preferida, { recursive: true });
    return preferida;
  } catch (falha) {
    const alternativa = pastaEscala(escalaId);
    try {
      await mkdir(alternativa, { recursive: true });
      return alternativa;
    } catch {
      throw new Error(
        falha instanceof Error
          ? `Não foi possível gravar no servidor: ${falha.message}`
          : "Não foi possível criar a pasta dos arquivos no servidor.",
      );
    }
  }
}

export async function gravarBufferEscala(
  escalaId: string,
  nomeOriginal: string,
  buffer: Buffer,
  musicaId: string | null,
  ordem: number,
) {
  const ext = extensaoArquivo(nomeOriginal);
  if (!EXTENSOES_ARQUIVO.has(ext)) {
    throw new Error("Use arquivos mp3, m4a, wav, ogg ou PDF.");
  }
  const pasta = await pastaGravacaoEscala(escalaId);
  const tipo = ext === "pdf" ? "pdf" : "audio";
  const discoNome = `${Date.now()}-${tipo}-${ordem}-${nomeArquivoSeguro(nomeOriginal)}`;
  await writeFile(path.join(pasta, discoNome), buffer);
  return {
    nome: nomeOriginal,
    path: caminhoLogico(escalaId, discoNome),
    ordem,
    musicaId,
  };
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
  const pasta = await pastaGravacaoEscala(escalaId);
  return gravarNaPasta(pasta, escalaId, enviados, ordemInicial);
}

async function gravarNaPasta(
  pasta: string,
  escalaId: string,
  enviados: EnvioArquivoEscala[],
  ordemInicial: number,
) {

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
    try {
      await writeFile(
        path.join(pasta, discoNome),
        Buffer.from(await arquivo.arrayBuffer()),
      );
    } catch (falha) {
      throw new Error(
        falha instanceof Error
          ? `Falha ao gravar ${nomeOriginal}: ${falha.message}`
          : `Falha ao gravar ${nomeOriginal} no servidor.`,
      );
    }
    criados.push({
      nome: nomeOriginal,
      path: caminhoLogico(escalaId, discoNome),
      ordem: ordem++,
      musicaId: envio.musicaId,
    });
  }

  return criados;
}
