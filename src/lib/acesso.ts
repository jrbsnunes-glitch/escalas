import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { obterSessao } from "./auth";
import type { Sessao } from "./types";
import { prisma } from "./prisma";
import { ehAdmin } from "./perfis";

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

export function escolherEscalasDaSemana<T extends { data: Date }>(escalas: T[]) {
  const inicio = inicioDoDiaSaoPaulo().getTime();
  const futuras = escalas
    .filter((escala) => escala.data.getTime() >= inicio)
    .sort((a, b) => a.data.getTime() - b.data.getTime());
  if (!futuras.length) return [];
  const alvo = futuras[0].data.getTime();
  return futuras.filter((escala) => escala.data.getTime() === alvo);
}

export async function idsEscalasDaSemanaMembro() {
  const futuras = await prisma.escala.findMany({
    where: { data: { gte: inicioDoDiaSaoPaulo() }, especial: false },
    select: { id: true, data: true },
    orderBy: { data: "asc" },
  });
  return new Set(escolherEscalasDaSemana(futuras).map((escala) => escala.id));
}

export async function membroPodeVerEscala(id: string) {
  const escala = await prisma.escala.findUnique({
    where: { id },
    select: { especial: true },
  });
  if (escala?.especial) return true;
  const ids = await idsEscalasDaSemanaMembro();
  return ids.has(id);
}
