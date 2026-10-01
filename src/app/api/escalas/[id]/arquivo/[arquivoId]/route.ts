import { unlink } from "node:fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recusarSeNaoAdmin } from "@/lib/acesso";
import { includeEscala, serializarEscala } from "@/lib/serializers";
import { discoDePathPublico } from "@/lib/arquivo-escala";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; arquivoId: string }> },
) {
  const { resposta } = await recusarSeNaoAdmin();
  if (resposta) return resposta;

  const { id, arquivoId } = await params;
  const arquivo = await prisma.arquivoEscala.findFirst({
    where: { id: arquivoId, escalaId: id },
  });
  if (!arquivo) {
    return NextResponse.json({ erro: "Arquivo não encontrado." }, { status: 404 });
  }

  await prisma.arquivoEscala.delete({ where: { id: arquivoId } });
  await unlink(discoDePathPublico(arquivo.path)).catch(() => undefined);

  const escala = await prisma.escala.findUniqueOrThrow({
    where: { id },
    include: includeEscala,
  });
  return NextResponse.json({ escala: serializarEscala(escala) });
}
