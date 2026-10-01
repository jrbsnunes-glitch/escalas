import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recusarSeNaoAdmin } from "@/lib/acesso";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { resposta } = await recusarSeNaoAdmin();
  if (resposta) return resposta;

  const { id } = await params;
  const corpo = await request.json();
  const funcao = await prisma.funcao.update({
    where: { id },
    data: {
      nome: corpo.nome !== undefined ? String(corpo.nome) : undefined,
      grupo:
        corpo.grupo === "CANTOR" || corpo.grupo === "MUSICO"
          ? String(corpo.grupo)
          : undefined,
      ordem: corpo.ordem !== undefined ? Number(corpo.ordem) : undefined,
      ativo: corpo.ativo !== undefined ? Boolean(corpo.ativo) : undefined,
    },
  });
  return NextResponse.json({ funcao });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { resposta } = await recusarSeNaoAdmin();
  if (resposta) return resposta;

  const { id } = await params;
  const existente = await prisma.funcao.findUnique({ where: { id } });
  if (!existente) {
    return NextResponse.json({ erro: "Função não encontrada." }, { status: 404 });
  }

  await prisma.funcao.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
