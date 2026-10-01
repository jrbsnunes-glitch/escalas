import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recusarSeNaoAdmin } from "@/lib/acesso";
import { configPadrao, recalcularBloco } from "@/lib/algoritmo";
import { deveMostrarParametrosVoz } from "@/lib/integrante";
import { parseDataIso } from "@/lib/datas";
import { serializarIntegrante } from "@/lib/serializers";
import type { ConfigGeracao } from "@/lib/types";

const include = { funcoes: { include: { funcao: true } } };

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { resposta } = await recusarSeNaoAdmin();
  if (resposta) return resposta;

  const { id } = await params;
  const cantor = await prisma.integrante.findUnique({ where: { id }, include });
  if (!cantor) {
    return NextResponse.json({ erro: "Cantor não encontrado." }, { status: 404 });
  }
  return NextResponse.json({ cantor: serializarIntegrante(cantor) });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { resposta } = await recusarSeNaoAdmin();
  if (resposta) return resposta;

  const { id } = await params;
  const corpo = await request.json();
  const funcoesIds: string[] | undefined = Array.isArray(corpo.funcoesIds)
    ? corpo.funcoesIds.map(String)
    : undefined;
  const perfil =
    corpo.perfil === "MUSICO" ||
    corpo.perfil === "AMBOS" ||
    corpo.perfil === "CANTOR"
      ? String(corpo.perfil)
      : undefined;

  const existente = await prisma.integrante.findUnique({
    where: { id },
    include: { funcoes: { include: { funcao: true } } },
  });
  if (!existente) {
    return NextResponse.json({ erro: "Cantor não encontrado." }, { status: 404 });
  }

  const funcoesParaRegra =
    funcoesIds === undefined
      ? existente.funcoes.map((item) => item.funcao)
      : await prisma.funcao.findMany({ where: { id: { in: funcoesIds } } });
  const precisaVoz = deveMostrarParametrosVoz(
    perfil ?? existente.perfil,
    funcoesParaRegra,
  );

  const cantor = await prisma.integrante.update({
    where: { id },
    data: {
      nome: corpo.nome !== undefined ? String(corpo.nome).trim() : undefined,
      perfil,
      voz: precisaVoz
        ? corpo.voz !== undefined
          ? String(corpo.voz)
          : undefined
        : "",
      afinacao: precisaVoz
        ? corpo.afinacao !== undefined
          ? Number(corpo.afinacao)
          : undefined
        : 0,
      tipoVoz: precisaVoz
        ? corpo.tipoVoz !== undefined
          ? String(corpo.tipoVoz)
          : undefined
        : "",
      leadVocal: precisaVoz
        ? corpo.leadVocal !== undefined
          ? String(corpo.leadVocal)
          : undefined
        : "",
      backingVocal: precisaVoz
        ? corpo.backingVocal !== undefined
          ? String(corpo.backingVocal)
          : undefined
        : "",
      ativo: corpo.ativo !== undefined ? Boolean(corpo.ativo) : undefined,
      nascimento:
        corpo.nascimento !== undefined ? parseDataIso(corpo.nascimento) : undefined,
      funcoes:
        funcoesIds === undefined
          ? undefined
          : {
              deleteMany: {},
              create: funcoesIds.map((funcaoId) => ({ funcaoId })),
            },
    },
    include,
  });

  return NextResponse.json({ cantor: serializarIntegrante(cantor) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { resposta } = await recusarSeNaoAdmin();
  if (resposta) return resposta;

  const { id } = await params;
  const existente = await prisma.integrante.findUnique({ where: { id } });
  if (!existente) {
    return NextResponse.json({ erro: "Cantor não encontrado." }, { status: 404 });
  }

  const alocacoes = await prisma.alocacao.findMany({
    where: { integranteId: id },
    select: { blocoId: true },
  });
  const blocoIds = [...new Set(alocacoes.map((item) => item.blocoId))];

  await prisma.$transaction([
    prisma.alocacao.deleteMany({ where: { integranteId: id } }),
    prisma.integrante.delete({ where: { id } }),
  ]);

  for (const blocoId of blocoIds) {
    const bloco = await prisma.bloco.findUnique({
      where: { id: blocoId },
      include: {
        alocacoes: { include: { integrante: true } },
        escala: true,
      },
    });
    if (!bloco) continue;

    let config = configPadrao();
    if (bloco.escala.criterios) {
      try {
        config = {
          ...config,
          ...(JSON.parse(bloco.escala.criterios) as ConfigGeracao),
        };
      } catch {
        /* mantém padrão */
      }
    }

    const metricas = recalcularBloco(
      bloco.alocacoes.map((item) => item.integrante),
      config,
    );
    await prisma.bloco.update({
      where: { id: blocoId },
      data: metricas,
    });
  }

  return NextResponse.json({ ok: true });
}
