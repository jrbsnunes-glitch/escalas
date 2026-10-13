import { prisma } from "./prisma";
import { partesHojeSaoPaulo } from "./datas";
import type { Sessao } from "./types";

function inicioDoDiaSaoPaulo() {
  return new Date(`${partesHojeSaoPaulo().ymd}T00:00:00.000-03:00`);
}

export async function registrarLogin(sessao: Pick<Sessao, "id" | "nome" | "perfil">) {
  try {
    await prisma.logAcesso.create({
      data: {
        usuarioId: sessao.id,
        nome: sessao.nome,
        perfil: sessao.perfil,
      },
    });
  } catch (falha) {
    console.error("Falha ao registrar login", falha);
  }
}

export async function registrarAcessoDoDia(
  sessao: Pick<Sessao, "id" | "nome" | "perfil">,
) {
  try {
    const existe = await prisma.logAcesso.findFirst({
      where: {
        usuarioId: sessao.id,
        criadoEm: { gte: inicioDoDiaSaoPaulo() },
      },
      select: { id: true },
    });
    if (existe) return;
    await prisma.logAcesso.create({
      data: {
        usuarioId: sessao.id,
        nome: sessao.nome,
        perfil: sessao.perfil,
      },
    });
  } catch (falha) {
    console.error("Falha ao registrar acesso", falha);
  }
}

export function formatarQuandoAcesso(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(data);
}

export function formatarDiaAcesso(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(data);
}
