import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recusarSeNaoAdmin } from "@/lib/acesso";
import { includeEscala, serializarEscala } from "@/lib/serializers";
import { TAMANHO_MAX_ARQUIVO, TAMANHO_MAX_ARQUIVO_MB } from "@/lib/musica";
import {
  gravarArquivosEscala,
  gravarBufferEscala,
  gravarPedacoUpload,
  montarPedacosUpload,
} from "@/lib/arquivo-escala";

export const runtime = "nodejs";
export const maxDuration = 300;

function ehArquivo(item: FormDataEntryValue): item is File {
  return (
    typeof item === "object" &&
    item !== null &&
    "arrayBuffer" in item &&
    "size" in item &&
    typeof (item as File).size === "number" &&
    (item as File).size > 0
  );
}

async function blobParaBuffer(arquivo: Blob) {
  return Buffer.from(await arquivo.arrayBuffer());
}

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

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      {
        erro: `O envio chegou incompleto. Tente um arquivo menor que ${TAMANHO_MAX_ARQUIVO_MB} MB.`,
      },
      { status: 400 },
    );
  }

  const arquivos = form
    .getAll("arquivo")
    .concat(form.getAll("arquivos"))
    .filter(ehArquivo);
  const musicaIds = form.getAll("musicaId").map((item) => String(item).trim());
  const uploadId = String(form.get("uploadId") ?? "").trim();
  const chunkIndex = Number(form.get("chunkIndex"));
  const totalChunks = Number(form.get("totalChunks"));
  const nomeOriginal = String(form.get("nomeOriginal") ?? "").trim();

  if (!arquivos.length) {
    return NextResponse.json({ erro: "Envie ao menos um arquivo." }, { status: 400 });
  }

  try {
    if (uploadId && Number.isInteger(chunkIndex) && totalChunks > 0) {
      const pedaco = arquivos[0];
      await gravarPedacoUpload(uploadId, chunkIndex, await blobParaBuffer(pedaco));
      if (chunkIndex + 1 < totalChunks) {
        return NextResponse.json({ ok: true, pendente: true });
      }
      const buffer = await montarPedacosUpload(uploadId, totalChunks);
      if (buffer.byteLength > TAMANHO_MAX_ARQUIVO) {
        return NextResponse.json(
          {
            erro: `O arquivo deve ter no máximo ${TAMANHO_MAX_ARQUIVO_MB} MB.`,
          },
          { status: 400 },
        );
      }
      const musicaId = musicaIds[0] || null;
      if (musicaId) {
        const musica = await prisma.musica.findUnique({ where: { id: musicaId } });
        if (!musica) {
          return NextResponse.json(
            { erro: "Música vinculada ao arquivo não encontrada." },
            { status: 400 },
          );
        }
      }
      const criado = await gravarBufferEscala(
        id,
        nomeOriginal || (pedaco as File).name || "arquivo.mp3",
        buffer,
        musicaId,
        (existente.arquivos[0]?.ordem ?? -1) + 1,
      );
      await prisma.arquivoEscala.create({
        data: {
          escalaId: id,
          musicaId: criado.musicaId,
          nome: criado.nome,
          path: criado.path,
          ordem: criado.ordem,
        },
      });
    } else {
      const enviados = arquivos.map((file, indice) => ({
        file: file as File,
        musicaId: musicaIds[indice] || null,
      }));

      for (const { file } of enviados) {
        if (file.size > TAMANHO_MAX_ARQUIVO) {
          return NextResponse.json(
            {
              erro: `O arquivo ${file.name || "anexo"} deve ter no máximo ${TAMANHO_MAX_ARQUIVO_MB} MB.`,
            },
            { status: 400 },
          );
        }
      }

      for (const { musicaId } of enviados) {
        if (!musicaId) continue;
        const musica = await prisma.musica.findUnique({ where: { id: musicaId } });
        if (!musica) {
          return NextResponse.json(
            { erro: "Música vinculada ao arquivo não encontrada." },
            { status: 400 },
          );
        }
      }

      const criados = await gravarArquivosEscala(
        id,
        enviados,
        (existente.arquivos[0]?.ordem ?? -1) + 1,
      );
      if (criados.length) {
        await prisma.arquivoEscala.createMany({
          data: criados.map((item) => ({
            escalaId: id,
            musicaId: item.musicaId,
            nome: item.nome,
            path: item.path,
            ordem: item.ordem,
          })),
        });
      }
    }
  } catch (falha) {
    console.error("Falha ao gravar arquivo da escala", falha);
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
