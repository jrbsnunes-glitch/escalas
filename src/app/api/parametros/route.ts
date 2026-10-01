import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recusarSeNaoAdmin } from "@/lib/acesso";

export async function GET() {
  const { resposta } = await recusarSeNaoAdmin();
  if (resposta) return resposta;

  const parametros = await prisma.parametro.findMany({
    orderBy: [{ categoria: "asc" }, { ordem: "asc" }],
  });
  return NextResponse.json({ parametros });
}

export async function POST(request: Request) {
  const { resposta } = await recusarSeNaoAdmin();
  if (resposta) return resposta;

  const corpo = await request.json();
  const parametro = await prisma.parametro.create({
    data: {
      categoria: String(corpo.categoria),
      valor: String(corpo.valor),
      rotulo: String(corpo.rotulo ?? corpo.valor),
      ordem: Number(corpo.ordem ?? 0),
      extra: corpo.extra ? String(corpo.extra) : null,
    },
  });
  return NextResponse.json({ parametro }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { resposta } = await recusarSeNaoAdmin();
  if (resposta) return resposta;

  const corpo = await request.json();
  const parametro = await prisma.parametro.update({
    where: { id: String(corpo.id) },
    data: {
      rotulo: corpo.rotulo !== undefined ? String(corpo.rotulo) : undefined,
      ordem: corpo.ordem !== undefined ? Number(corpo.ordem) : undefined,
      ativo: corpo.ativo !== undefined ? Boolean(corpo.ativo) : undefined,
      extra: corpo.extra !== undefined ? String(corpo.extra) : undefined,
    },
  });
  return NextResponse.json({ parametro });
}
