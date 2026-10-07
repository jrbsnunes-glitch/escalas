import { createWriteStream, type WriteStream } from "node:fs";
import {
  access,
  appendFile,
  mkdir,
  readFile,
  rm,
  stat,
  statfs,
  writeFile,
} from "node:fs/promises";
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
/** Pasta antiga dentro de public/uploads. */
export const PASTA_ESCALAS_UPLOAD = path.join(
  process.cwd(),
  "public",
  "uploads",
  "escalas",
);
/** Pasta única de gravação (fora de public). */
export const PASTA_ESCALAS = path.join(process.cwd(), "data", "escalas");
/** Pasta antiga ao lado do SQLite. */
export const PASTA_ESCALAS_PRISMA = path.join(
  process.cwd(),
  "prisma",
  "uploads-escalas",
);
const PASTA_TMP_UPLOADS = path.join(process.cwd(), "data", "tmp-uploads");

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
    path.join(PASTA_ESCALAS, arquivo.escalaId, nome),
    path.join(PASTA_ESCALAS_UPLOAD, arquivo.escalaId, nome),
    path.join(PASTA_ESCALAS_PRISMA, arquivo.escalaId, nome),
    path.join(PASTA_ESCALAS_PUBLICA, arquivo.escalaId, nome),
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
  await rm(path.join(PASTA_ESCALAS_PRISMA, escalaId), {
    recursive: true,
    force: true,
  });
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

function pastaTmpUpload(uploadId: string) {
  return path.join(PASTA_TMP_UPLOADS, idUploadSeguro(uploadId));
}

export async function diagnosticarGravacao() {
  const pasta = PASTA_ESCALAS;
  let gravavel = false;
  let erro: string | null = null;
  try {
    await mkdir(pasta, { recursive: true });
    await mkdir(PASTA_TMP_UPLOADS, { recursive: true });
    const teste = path.join(pasta, ".write-test");
    await writeFile(/* turbopackIgnore: true */ teste, "ok");
    await rm(/* turbopackIgnore: true */ teste, { force: true });
    gravavel = true;
  } catch (falha) {
    erro = falha instanceof Error ? falha.message : "Falha ao gravar.";
  }
  let discoLivre: number | null = null;
  try {
    const info = await statfs(/* turbopackIgnore: true */ pasta);
    discoLivre = Number(info.bavail) * Number(info.bsize);
  } catch {
    discoLivre = null;
  }
  return { ok: gravavel, pasta, discoLivre, erro };
}

export async function pastaGravacaoEscala(escalaId: string) {
  const pasta = pastaEscala(escalaId);
  try {
    await mkdir(pasta, { recursive: true });
    return pasta;
  } catch (falha) {
    throw new Error(
      falha instanceof Error
        ? `Não foi possível gravar em data/escalas: ${falha.message}`
        : "Não foi possível criar a pasta dos arquivos no servidor.",
    );
  }
}

async function encerrarEscrita(stream: WriteStream) {
  await new Promise<void>((resolve, reject) => {
    stream.end((erro: NodeJS.ErrnoException | null | undefined) => {
      if (erro) reject(erro);
      else resolve();
    });
  });
}

export async function gravarPedacoDeRequest(
  uploadId: string,
  indice: number,
  request: Request,
) {
  if (!request.body) {
    throw new Error("O envio chegou vazio. A rede cortou o arquivo.");
  }
  const pasta = pastaTmpUpload(uploadId);
  await mkdir(pasta, { recursive: true });
  const destino = path.join(pasta, `${indice}.part`);
  const saida = createWriteStream(/* turbopackIgnore: true */ destino);
  const leitor = request.body.getReader();
  try {
    while (true) {
      const { done, value } = await leitor.read();
      if (done) break;
      if (!value?.byteLength) continue;
      await new Promise<void>((resolve, reject) => {
        saida.write(value, (erro) => (erro ? reject(erro) : resolve()));
      });
    }
  } catch (falha) {
    saida.destroy();
    await rm(/* turbopackIgnore: true */ destino, { force: true });
    throw falha;
  }
  await encerrarEscrita(saida);
  const { size } = await stat(/* turbopackIgnore: true */ destino);
  if (!size) {
    throw new Error("O envio chegou vazio. A rede cortou o arquivo.");
  }
  return size;
}

export async function gravarPedacoUpload(
  uploadId: string,
  indice: number,
  buffer: Buffer,
) {
  if (!buffer.byteLength) {
    throw new Error("O envio chegou vazio. A rede cortou o arquivo.");
  }
  const pasta = pastaTmpUpload(uploadId);
  await mkdir(pasta, { recursive: true });
  await writeFile(/* turbopackIgnore: true */ path.join(pasta, `${indice}.part`), buffer);
}

export async function juntarPedacosEGravar(
  escalaId: string,
  uploadId: string,
  total: number,
  nomeOriginal: string,
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
  const destino = path.join(pasta, discoNome);
  const tmp = pastaTmpUpload(uploadId);
  try {
    await writeFile(/* turbopackIgnore: true */ destino, Buffer.alloc(0));
    for (let indice = 0; indice < total; indice++) {
      const parte = path.join(tmp, `${indice}.part`);
      await access(/* turbopackIgnore: true */ parte);
      await appendFile(
        /* turbopackIgnore: true */ destino,
        await readFile(/* turbopackIgnore: true */ parte),
      );
    }
  } catch (falha) {
    await rm(/* turbopackIgnore: true */ destino, { force: true });
    throw falha;
  }
  await rm(/* turbopackIgnore: true */ tmp, { recursive: true, force: true });
  const { size } = await stat(/* turbopackIgnore: true */ destino);
  if (!size) {
    throw new Error("O arquivo chegou vazio ao servidor.");
  }
  return {
    nome: nomeOriginal,
    path: caminhoLogico(escalaId, discoNome),
    ordem,
    musicaId,
    bytes: size,
  };
}

export async function gravarBufferEscala(
  escalaId: string,
  nomeOriginal: string,
  buffer: Buffer,
  musicaId: string | null,
  ordem: number,
) {
  if (!buffer.byteLength) {
    throw new Error("O arquivo chegou vazio ao servidor.");
  }
  const ext = extensaoArquivo(nomeOriginal);
  if (!EXTENSOES_ARQUIVO.has(ext)) {
    throw new Error("Use arquivos mp3, m4a, wav, ogg ou PDF.");
  }
  const pasta = await pastaGravacaoEscala(escalaId);
  const tipo = ext === "pdf" ? "pdf" : "audio";
  const discoNome = `${Date.now()}-${tipo}-${ordem}-${nomeArquivoSeguro(nomeOriginal)}`;
  try {
    await writeFile(/* turbopackIgnore: true */ path.join(pasta, discoNome), buffer);
  } catch (falha) {
    throw new Error(
      falha instanceof Error
        ? `Falha ao gravar ${nomeOriginal}: ${falha.message}`
        : `Falha ao gravar ${nomeOriginal} no servidor.`,
    );
  }
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
  const criados: {
    nome: string;
    path: string;
    ordem: number;
    musicaId: string | null;
  }[] = [];
  let ordem = ordemInicial;
  for (const envio of enviados) {
    const buffer = Buffer.from(await envio.file.arrayBuffer());
    criados.push(
      await gravarBufferEscala(
        escalaId,
        envio.file.name,
        buffer,
        envio.musicaId,
        ordem++,
      ),
    );
  }
  return criados;
}
