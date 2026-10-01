import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recusarSeNaoAdmin } from "@/lib/acesso";
import { includeEscala, serializarEscala } from "@/lib/serializers";
import { TAMANHO_MAX_ARQUIVO } from "@/lib/musica";
import { gravarArquivosEscala } from "@/lib/arquivo-escala";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { resposta } = await recusarSeNaoAdmin();
  if (resposta) return resposta;

  const { id } = await params;
  const existente = await prisma.escala.findUnique({
    where: { id },
    include: { arquivos: { orderBy: { ordem: "desc" } } },
  });
  if (!existente) {
    return NextResponse.json({ erro: "Escala não encontrada." }, { status: 404 });
  }

  const form = await request.formData();
  const arquivos = form
    .getAll("arquivo")
    .concat(form.getAll("arquivos"))
    .filter((item): item is File => item instanceof File && item.size > 0);
  const musicaIds = form.getAll("musicaId").map((item) => String(item).trim());

  if (!arquivos.length) {
    return NextResponse.json({ erro: "Envie ao menos um arquivo." }, { status: 400 });
  }

  const enviados = arquivos.map((file, indice) => ({
    file,
    musicaId: musicaIds[indice] || null,
  }));

  for (const { file } of enviados) {
    if (file.size > TAMANHO_MAX_ARQUIVO) {
      return NextResponse.json(
        { erro: `O arquivo ${file.name} deve ter no máximo 15 MB.` },
        { status: 400 },
      );
    }
  }

  for (const { musicaId } of enviados) {
    if (!musicaId) continue;
    const musica = await prisma.musica.findUnique({ where: { id: musicaId } });
    if (!musica) {
      return NextResponse.json({ erro: "Música vinculada ao arquivo não encontrada." }, { status: 400 });
    }
  }

  try {
    const criados = await gravarArquivosEscala(
      id,
      enviados,
      (existente.arquivos[0]?.ordem ?? -1) + 1,
    );
    if (criados.length) {
      await prisma.arquivoEscala.createMany({ data: criados.map((item) => ({
        escalaId: id,
        musicaId: item.musicaId,
        nome: item.nome,
        path: item.path,
        ordem: item.ordem,
      })) });
    }
  } catch (falha) {
    return NextResponse.json(
      { erro: falha instanceof Error ? falha.message : "Não foi possível enviar." },
      { status: 400 },
    );
  }

  const escala = await prisma.escala.findUniqueOrThrow({
    where: { id },
    include: includeEscala,
  });
  return NextResponse.json({ escala: serializarEscala(escala) });
}
