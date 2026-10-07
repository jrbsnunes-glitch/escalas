import { EXTENSOES_AUDIO, extensaoArquivo } from "./musica";
import type { ArquivoEscalaResumo, EscalaDetalhe } from "./types";

export function arquivosDaMusica(
  arquivos: ArquivoEscalaResumo[],
  musicaId: string,
) {
  return arquivos.filter((item) => item.musicaId === musicaId);
}

export function arquivosSemMusica(arquivos: ArquivoEscalaResumo[]) {
  return arquivos.filter((item) => !item.musicaId);
}

export function tituloMusicaNaEscala(escala: EscalaDetalhe, musicaId: string | null) {
  if (!musicaId) return null;
  for (const bloco of escala.blocos) {
    for (const alocacao of bloco.alocacoes) {
      if (alocacao.musica?.id === musicaId) {
        return alocacao.musica.titulo;
      }
    }
  }
  return null;
}

export function rotuloArquivoEscala(
  arquivo: ArquivoEscalaResumo,
  arquivos: ArquivoEscalaResumo[],
) {
  const ext = extensaoArquivo(arquivo.nome);
  if (ext === "zip") {
    return arquivo.nome;
  }
  if (EXTENSOES_AUDIO.has(ext)) {
    const audios = arquivos.filter((item) =>
      EXTENSOES_AUDIO.has(extensaoArquivo(item.nome)),
    );
    return audios.length > 1 ? `Áudio · ${arquivo.nome}` : "Áudio";
  }
  if (ext === "pdf") {
    const pdfs = arquivos.filter((item) => extensaoArquivo(item.nome) === "pdf");
    return pdfs.length > 1 ? `Cifra · ${arquivo.nome}` : "Cifra";
  }
  return arquivo.nome;
}
