import type { TipoDispositivo } from "./types";

export function classificarPorViewport(largura: number): TipoDispositivo {
  if (largura < 768) return "mobile";
  if (largura < 1024) return "tablet";
  if (largura < 1440) return "notebook";
  return "desktop";
}

export function rotuloDispositivo(tipo: TipoDispositivo) {
  if (tipo === "mobile") return "Celular";
  if (tipo === "tablet") return "Tablet";
  if (tipo === "notebook") return "Notebook";
  return "Computador";
}
