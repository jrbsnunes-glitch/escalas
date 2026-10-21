import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { obterSessao } from "./auth";
import type { Sessao } from "./types";
import { prisma } from "./prisma";
import { ehAdmin } from "./perfis";
import { fimDoDomingoDaSemanaSaoPaulo } from "./datas";

export { ehAdmin, destinoAposLogin, destinoInicial, rotuloPerfil } from "./perfis";
export { ehPerfilUsuario } from "./types";

export async function exigirSessaoPage() {
  const sessao = await obterSessao();
  if (!sessao) redirect("/login");
  return sessao;
}

export async function exigirAdmin() {
  const sessao = await exigirSessaoPage();
  if (!ehAdmin(sessao)) redirect("/escalas");
  return sessao;
}

export async function recusarSeNaoAutenticado() {
  const sessao = await obterSessao();
  if (!sessao) {
    return {
      sessao: null as Sessao | null,
      resposta: NextResponse.json({ erro: "Não autenticado." }, { status: 401 }),
    };
  }
  return { sessao, resposta: null };
}

export function responderSeSemSessao(
  resposta: NextResponse | null,
  sessao: Sessao | null,
) {
  if (resposta) return resposta;
  if (!sessao) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  return null;
}

export type ResultadoSessaoApi =
  | { ok: false; resposta: NextResponse }
  | { ok: true; sessao: Sessao };

export function validarSessaoApi(
  resposta: NextResponse | null,
  sessao: Sessao | null,
): ResultadoSessaoApi {
  const bloqueio = responderSeSemSessao(resposta, sessao);
  if (bloqueio) return { ok: false, resposta: bloqueio };
  return { ok: true, sessao: sessao! };
}

export async function recusarSeNaoAdmin() {
  const { sessao, resposta } = await recusarSeNaoAutenticado();
  if (resposta || !sessao) {
    return {
      sessao: null as Sessao | null,
      resposta:
        resposta ??
        NextResponse.json({ erro: "Não autenticado." }, { status: 401 }),
    };
  }
  if (!ehAdmin(sessao)) {
    return {
      sessao,
      resposta: NextResponse.json(
        { erro: "Acesso restrito ao administrador." },
        { status: 403 },
      ),
    };
  }
  return { sessao, resposta: null };
}

export function inicioDoDiaSaoPaulo(agora = new Date()) {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
  return new Date(`${ymd}T00:00:00.000-03:00`);
}

export function whereEscalasVisiveisMembro(integranteId: string) {
  const inicio = inicioDoDiaSaoPaulo();
  const fim = fimDoDomingoDaSemanaSaoPaulo();
  return {
    especial: false as const,
    OR: [
      { data: { gte: inicio, lte: fim } },
      {
        data: { gte: inicio },
        blocos: {
          some: { alocacoes: { some: { integranteId } } },
        },
      },
      {
        data: { gte: inicio },
        engenheiroSomId: integranteId,
      },
      {
        data: { gte: inicio },
        blocos: { some: { engenheiroSomId: integranteId } },
      },
    ],
  };
}

export function escolherEscalasDaSemana<T extends { data: Date }>(escalas: T[]) {
  const inicio = inicioDoDiaSaoPaulo().getTime();
  const fim = fimDoDomingoDaSemanaSaoPaulo().getTime();
  return escalas
    .filter((escala) => {
      const tempo = escala.data.getTime();
      return tempo >= inicio && tempo <= fim;
    })
    .sort((a, b) => a.data.getTime() - b.data.getTime());
}

export function escolherEscalasVisiveisMembro<
  T extends { id: string; data: Date },
>(escalas: T[], idsEmQueEsta: Set<string>) {
  const inicio = inicioDoDiaSaoPaulo().getTime();
  const daSemana = escolherEscalasDaSemana(escalas);
  const proprias = escalas.filter(
    (escala) => escala.data.getTime() >= inicio && idsEmQueEsta.has(escala.id),
  );
  const unicas = new Map<string, T>();
  for (const escala of [...daSemana, ...proprias]) {
    unicas.set(escala.id, escala);
  }
  return [...unicas.values()].sort((a, b) => a.data.getTime() - b.data.getTime());
}

export async function idsEscalasVisiveisMembro(integranteId: string) {
  const escalas = await prisma.escala.findMany({
    where: whereEscalasVisiveisMembro(integranteId),
    select: { id: true },
  });
  return new Set(escalas.map((escala) => escala.id));
}

export async function membroPodeVerEscala(id: string, integranteId: string) {
  const escala = await prisma.escala.findUnique({
    where: { id },
    select: { especial: true },
  });
  if (escala?.especial) return true;
  const ids = await idsEscalasVisiveisMembro(integranteId);
  return ids.has(id);
}
