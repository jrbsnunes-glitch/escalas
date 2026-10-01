import type { Musica } from "@prisma/client";
import type { MusicaResumo } from "./types";

const HOSTS_YOUTUBE = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

export const EXTENSOES_ARQUIVO = new Set(["mp3", "m4a", "wav", "ogg", "pdf"]);
export const EXTENSOES_AUDIO = new Set(["mp3", "m4a", "wav", "ogg"]);
export const TAMANHO_MAX_ARQUIVO = 15 * 1024 * 1024;

export function serializarMusica(musica: Musica): MusicaResumo {
  return {
    id: musica.id,
    titulo: musica.titulo,
    youtubeUrl: musica.youtubeUrl,
    arquivoNome: "",
    arquivoPath: "",
    arquivos: [],
    ativo: musica.ativo,
  };
}

export function normalizarYoutube(url: string) {
  const texto = url.trim();
  if (!texto) return "";
  try {
    const parsed = new URL(texto);
    if (!HOSTS_YOUTUBE.has(parsed.hostname.toLowerCase())) {
      return null;
    }
    return texto;
  } catch {
    return null;
  }
}

export function extensaoArquivo(nome: string) {
  const partes = nome.toLowerCase().split(".");
  return partes.length > 1 ? partes.at(-1) ?? "" : "";
}

export function nomeArquivoSeguro(nome: string) {
  const base = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "arquivo";
}
