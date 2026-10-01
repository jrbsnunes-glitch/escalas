import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recusarSeNaoAdmin } from "@/lib/acesso";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { resposta } = await recusarSeNaoAdmin();
  if (resposta) return resposta;

  const { id } = await params;
  const existente = await prisma.parametro.findUnique({ where: { id } });
  if (!existente) {
    return NextResponse.json({ erro: "Parâmetro não encontrado." }, { status: 404 });
  }

  await prisma.parametro.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
