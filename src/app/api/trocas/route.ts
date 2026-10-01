import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  recusarSeNaoAdmin,
  recusarSeNaoAutenticado,
  validarSessaoApi,
} from "@/lib/acesso";
import {
  ehAlocacaoMusico,
  includePedidoTroca,
  podeExercerInstrumento,
  podeSerLeadVocal,
  serializarPedidoTroca,
} from "@/lib/troca";

export async function GET() {
  const auth = await recusarSeNaoAutenticado();
  const gate = validarSessaoApi(auth.resposta, auth.sessao);
  if (!gate.ok) return gate.resposta;
  const sessao = gate.sessao;

  const pedidos = await prisma.pedidoTroca.findMany({
    where:
      sessao.perfil === "ADMIN"
        ? { status: "PENDENTE" }
        : { solicitanteId: sessao.integranteId },
    include: includePedidoTroca,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    pedidos: pedidos.map(serializarPedidoTroca),
  });
}

export async function POST(request: Request) {
  const auth = await recusarSeNaoAutenticado();
  const gate = validarSessaoApi(auth.resposta, auth.sessao);
  if (!gate.ok) return gate.resposta;
  const sessao = gate.sessao;

  const corpo = await request.json().catch(() => null);
  const alocacaoId = String(corpo?.alocacaoId ?? "").trim();
  const substitutoId = String(corpo?.substitutoId ?? "").trim();
  const musicaId = String(corpo?.musicaId ?? "").trim();

  if (!alocacaoId || !substitutoId) {
    return NextResponse.json(
      { erro: "Escolha quem assume no seu lugar." },
      { status: 400 },
    );
  }

  const alocacao = await prisma.alocacao.findUnique({
    where: { id: alocacaoId },
    include: { integrante: true, funcao: true },
  });
  if (!alocacao || alocacao.integranteId !== sessao.integranteId) {
    return NextResponse.json(
      { erro: "Você só pode solicitar troca na sua linha da escala." },
      { status: 403 },
    );
  }
  if (substitutoId === sessao.integranteId) {
    return NextResponse.json(
      { erro: "Escolha outra pessoa para substituí-lo." },
      { status: 400 },
    );
  }

  const sessaoMusico = ehAlocacaoMusico(alocacao);
  if (!sessaoMusico && !musicaId) {
    return NextResponse.json(
      { erro: "Escolha a música e o cantor Lead Vocal." },
      { status: 400 },
    );
  }

  const [substituto, musica] = await Promise.all([
    prisma.integrante.findUnique({
      where: { id: substitutoId },
      include: { funcoes: { include: { funcao: true } } },
    }),
    musicaId ? prisma.musica.findUnique({ where: { id: musicaId } }) : Promise.resolve(null),
  ]);
  if (!substituto?.ativo) {
    return NextResponse.json(
      { erro: "Substituto inválido." },
      { status: 400 },
    );
  }
  if (sessaoMusico) {
    if (!podeExercerInstrumento(substituto, alocacao.funcao)) {
      return NextResponse.json(
        {
          erro: alocacao.funcao
            ? `Só quem tem ${alocacao.funcao.nome} no cadastro pode assumir este lugar.`
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

  const jaPendente = await prisma.pedidoTroca.findFirst({
    where: {
      alocacaoId,
      solicitanteId: sessao.integranteId,
      status: "PENDENTE",
    },
  });
  if (jaPendente) {
    return NextResponse.json(
      { erro: "Já existe um pedido de troca nesta linha." },
      { status: 409 },
    );
  }

  const pedido = await prisma.pedidoTroca.create({
    data: {
      alocacaoId,
      solicitanteId: sessao.integranteId,
      substitutoId,
      musicaId: sessaoMusico ? null : musicaId,
    },
    include: includePedidoTroca,
  });

  return NextResponse.json(
    { pedido: serializarPedidoTroca(pedido) },
    { status: 201 },
  );
}
