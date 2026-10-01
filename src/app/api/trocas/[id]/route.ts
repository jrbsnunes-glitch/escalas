import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recusarSeNaoAdmin } from "@/lib/acesso";
import {
  ehAlocacaoMusico,
  includePedidoTroca,
  podeExercerInstrumento,
  podeSerLeadVocal,
  serializarPedidoTroca,
} from "@/lib/troca";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { resposta } = await recusarSeNaoAdmin();
  if (resposta) return resposta;

  const { id } = await params;
  const pedido = await prisma.pedidoTroca.findUnique({
    where: { id },
    include: { alocacao: { include: { funcao: true } } },
  });
  if (!pedido || pedido.status !== "PENDENTE") {
    return NextResponse.json(
      { erro: "Pedido não encontrado ou já resolvido." },
      { status: 404 },
    );
  }

  const corpo = await request.json().catch(() => null);
  const acao = String(corpo?.acao ?? "");
  const substitutoId = String(corpo?.substitutoId ?? pedido.substitutoId).trim();
  const musicaId = String(corpo?.musicaId ?? pedido.musicaId ?? "").trim();
  const sessaoMusico = ehAlocacaoMusico(pedido.alocacao);

  if (acao === "recusar") {
    const atualizado = await prisma.pedidoTroca.update({
      where: { id },
      data: { status: "RECUSADO" },
      include: includePedidoTroca,
    });
    return NextResponse.json({ pedido: serializarPedidoTroca(atualizado) });
  }

  if (acao !== "aprovar") {
    return NextResponse.json({ erro: "Informe a ação." }, { status: 400 });
  }

  const [substituto, musica] = await Promise.all([
    prisma.integrante.findUnique({
      where: { id: substitutoId },
      include: { funcoes: { include: { funcao: true } } },
    }),
    musicaId ? prisma.musica.findUnique({ where: { id: musicaId } }) : Promise.resolve(null),
  ]);
  if (!substituto?.ativo) {
    return NextResponse.json({ erro: "Substituto inválido." }, { status: 400 });
  }
  if (sessaoMusico) {
    if (!podeExercerInstrumento(substituto, pedido.alocacao.funcao)) {
      return NextResponse.json(
        {
          erro: pedido.alocacao.funcao
            ? `Só quem tem ${pedido.alocacao.funcao.nome} no cadastro pode assumir este lugar.`
            : "Só quem tem o instrumento no cadastro pode assumir este lugar.",
        },
        { status: 400 },
      );
    }
  } else if (!podeSerLeadVocal(substituto) || !musica?.ativo) {
    return NextResponse.json(
      { erro: "Música ou cantor inválido." },
      { status: 400 },
    );
  }

  const [atualizado] = await prisma.$transaction([
    prisma.pedidoTroca.update({
      where: { id },
      data: sessaoMusico
        ? { status: "APROVADO", substitutoId, musicaId: null }
        : { status: "APROVADO", substitutoId, musicaId },
      include: includePedidoTroca,
    }),
    prisma.alocacao.update({
      where: { id: pedido.alocacaoId },
      data: sessaoMusico
        ? { integranteId: substitutoId }
        : { integranteId: substitutoId, musicaId },
    }),
  ]);

  return NextResponse.json({ pedido: serializarPedidoTroca(atualizado) });
}
