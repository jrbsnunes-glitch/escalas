import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  EXTENSOES_ARQUIVO,
  EXTENSOES_AUDIO,
  extensaoArquivo,
  nomeArquivoSeguro,
} from "./musica";
export const PASTA_ESCALAS = path.join(process.cwd(), "public", "escalas");

export function pastaEscala(escalaId: string) {
  return path.join(PASTA_ESCALAS, escalaId);
}

export function caminhoPublico(escalaId: string, nomeArquivo: string) {
  return `/escalas/${escalaId}/${nomeArquivo}`;
}

export function discoDePathPublico(arquivoPath: string) {
  return path.join(process.cwd(), "public", arquivoPath.replace(/^\//, ""));
}

export async function apagarPastaEscala(escalaId: string) {
  await rm(pastaEscala(escalaId), { recursive: true, force: true });
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
      path: caminhoPublico(escalaId, discoNome),
      ordem: ordem++,
      musicaId: envio.musicaId,
    });
  }

  return criados;
}
