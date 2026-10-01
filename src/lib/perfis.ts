import type { PerfilUsuario } from "./types";

export const PERFIS_USUARIO: { valor: PerfilUsuario; rotulo: string }[] = [
  { valor: "ADMIN", rotulo: "Administrador" },
  { valor: "MEMBRO", rotulo: "Membro" },
];

export function rotuloPerfil(perfil: PerfilUsuario) {
  return perfil === "ADMIN" ? "Administrador" : "Membro";
}

export function ehAdmin(sessao: { perfil: PerfilUsuario }) {
  return sessao.perfil === "ADMIN";
}

export function destinoInicial(perfil: PerfilUsuario) {
  return perfil === "ADMIN" ? "/dashboard" : "/escalas";
}

export function destinoAposLogin(perfil: PerfilUsuario, next?: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return destinoInicial(perfil);
  }
  if (perfil === "ADMIN") return next;
  const permitido =
    next === "/escalas" ||
    next === "/aniversariantes" ||
    (/^\/escalas\/[^/]+$/.test(next) && !next.endsWith("/editar"));
  return permitido ? next : "/escalas";
}
