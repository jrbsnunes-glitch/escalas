import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recusarSeNaoAdmin } from "@/lib/acesso";
import { normalizarYoutube, serializarMusica } from "@/lib/musica";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { resposta } = await recusarSeNaoAdmin();
  if (resposta) return resposta;

  const { id } = await params;
  const existente = await prisma.musica.findUnique({ where: { id } });
  if (!existente) {
    return NextResponse.json({ erro: "Música não encontrada." }, { status: 404 });
  }

  const corpo = await request.json();
  let youtubeUrl = existente.youtubeUrl;
  if (corpo.youtubeUrl !== undefined) {
    const normalizado = normalizarYoutube(String(corpo.youtubeUrl));
    if (normalizado === null) {
      return NextResponse.json(
        { erro: "Informe um link válido do YouTube." },
        { status: 400 },
      );
    }
    youtubeUrl = normalizado;
  }

  const atualizada = await prisma.musica.update({
    where: { id },
    data: {
      titulo: corpo.titulo !== undefined ? String(corpo.titulo).trim() : undefined,
      youtubeUrl,
      ativo: corpo.ativo !== undefined ? Boolean(corpo.ativo) : undefined,
    },
  });
  return NextResponse.json({ musica: serializarMusica(atualizada) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { resposta } = await recusarSeNaoAdmin();
  if (resposta) return resposta;

  const { id } = await params;
  const existente = await prisma.musica.findUnique({ where: { id } });
  if (!existente) {
    return NextResponse.json({ erro: "Música não encontrada." }, { status: 404 });
  }

  await prisma.alocacao.updateMany({
    where: { musicaId: id },
    data: { musicaId: null },
  });
  await prisma.musica.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
