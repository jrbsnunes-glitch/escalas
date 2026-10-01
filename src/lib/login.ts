import type { Integrante, Usuario } from "@prisma/client";
import { prisma } from "./prisma";

export function normalizarNomeLogin(nome: string) {
  return nome.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

/** E-mail técnico único; não é usado na tela de login. */
export function emailInterno(integranteId: string) {
  return `${integranteId}@interno.escalas`;
}

export type ResultadoBuscaLogin =
  | { erro: string }
  | { usuario: Usuario; integrante: Integrante };

export async function buscarUsuarioPorLogin(
  nomeInformado: string,
): Promise<ResultadoBuscaLogin> {
  const alvo = normalizarNomeLogin(nomeInformado);
  if (!alvo) return { erro: "Informe usuário e senha." };

  const candidatos = await prisma.integrante.findMany({
    where: { ativo: true, usuario: { isNot: null } },
    include: { usuario: true },
  });

  const iguais = candidatos.filter(
    (item) => normalizarNomeLogin(item.nome) === alvo,
  );

  if (iguais.length === 0) {
    return { erro: "Credenciais inválidas." };
  }
  if (iguais.length > 1) {
    return {
      erro: "Há mais de uma pessoa com este nome. Peça ao administrador para ajustar o cadastro.",
    };
  }

  const integrante = iguais[0];
  if (!integrante.usuario) {
    return { erro: "Credenciais inválidas." };
  }

  return { usuario: integrante.usuario, integrante };
}
