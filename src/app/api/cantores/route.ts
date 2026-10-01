import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recusarSeNaoAdmin } from "@/lib/acesso";
import { deveMostrarParametrosVoz } from "@/lib/integrante";
import { parseDataIso } from "@/lib/datas";
import { serializarIntegrante } from "@/lib/serializers";

const include = { funcoes: { include: { funcao: true } } };

export async function GET(request: Request) {
  const { resposta } = await recusarSeNaoAdmin();
  if (resposta) return resposta;

  const { searchParams } = new URL(request.url);
  const incluirInativos = searchParams.get("inativos") === "1";

  const cantores = await prisma.integrante.findMany({
    where: incluirInativos ? undefined : { ativo: true },
    include,
    orderBy: { nome: "asc" },
  });

  return NextResponse.json({
    cantores: cantores.map(serializarIntegrante),
  });
}

export async function POST(request: Request) {
  const { resposta } = await recusarSeNaoAdmin();
  if (resposta) return resposta;

  const corpo = await request.json();
  const nome = String(corpo.nome ?? "").trim();
  if (!nome) {
    return NextResponse.json({ erro: "Informe o nome do cantor." }, { status: 400 });
  }

  const funcoesIds: string[] = Array.isArray(corpo.funcoesIds)
    ? corpo.funcoesIds.map(String)
    : [];
  const perfil =
    corpo.perfil === "MUSICO" || corpo.perfil === "AMBOS"
      ? String(corpo.perfil)
      : "CANTOR";
  const funcoesMarcadas = funcoesIds.length
    ? await prisma.funcao.findMany({ where: { id: { in: funcoesIds } } })
    : [];
  const precisaVoz = deveMostrarParametrosVoz(perfil, funcoesMarcadas);
  const afinacao = Number(corpo.afinacao);

  if (precisaVoz && ![1, 2, 3, 4].includes(afinacao)) {
    return NextResponse.json(
      { erro: "Afinação deve ser um valor de 1 a 4." },
      { status: 400 },
    );
  }

  const cantor = await prisma.integrante.create({
    data: {
      nome,
      perfil,
      voz: precisaVoz ? String(corpo.voz ?? "") : "",
      afinacao: precisaVoz ? afinacao : 0,
      tipoVoz: precisaVoz ? String(corpo.tipoVoz ?? "") : "",
      leadVocal: precisaVoz ? String(corpo.leadVocal ?? "") : "",
      backingVocal: precisaVoz ? String(corpo.backingVocal ?? "") : "",
      nascimento: parseDataIso(corpo.nascimento),
      ativo: corpo.ativo === undefined ? true : Boolean(corpo.ativo),
      funcoes: {
        create: funcoesIds.map((funcaoId) => ({ funcaoId })),
      },
    },
    include,
  });

  return NextResponse.json({ cantor: serializarIntegrante(cantor) }, { status: 201 });
}
