import type { Funcao, Integrante, Usuario } from "@prisma/client";
import { ehPerfilUsuario, type PerfilUsuario } from "./types";

export const includeUsuario = {
  integrante: true,
} as const;

type UsuarioComIntegrante = Usuario & {
  integrante: Integrante & {
    funcoes?: { funcao: Funcao }[];
  };
};

export function serializarUsuario(usuario: UsuarioComIntegrante) {
  const perfil: PerfilUsuario = ehPerfilUsuario(usuario.perfil)
    ? usuario.perfil
    : "MEMBRO";
  return {
    id: usuario.id,
    integranteId: usuario.integranteId,
    nome: usuario.integrante.nome,
    email: usuario.email,
    perfil,
    ativo: usuario.integrante.ativo,
    papelMinisterio: usuario.integrante.perfil,
  };
}
