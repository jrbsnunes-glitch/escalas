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
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type EscalaComArquivos = {
  arquivos: { ordem: number }[];
};

async function blobParaBuffer(arquivo: Blob) {
  return Buffer.from(await arquivo.arrayBuffer());
}

function ehArquivo(item: FormDataEntryValue): item is File {
  return (
    typeof item === "object" &&
    item !== null &&
    "arrayBuffer" in item &&
    typeof (item as Blob).arrayBuffer === "function"
  );
}

async function responderEscala(id: string) {
  const escala = await prisma.escala.findUniqueOrThrow({
    where: { id },
    include: includeEscala,
  });
  return NextResponse.json({ escala: serializarEscala(escala) });
}

async function finalizarArquivo(
  escalaId: string,
  existente: EscalaComArquivos,
  nomeOriginal: string,
  buffer: Buffer,
  musicaId: string | null,
) {
  if (buffer.byteLength > TAMANHO_MAX_ARQUIVO) {
    return NextResponse.json(
      { erro: `O arquivo deve ter no máximo ${TAMANHO_MAX_ARQUIVO_MB} MB.` },
      { status: 400 },
    );
  }
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
    escalaId,
    nomeOriginal || "arquivo.mp3",
    buffer,
    musicaId,
    (existente.arquivos[0]?.ordem ?? -1) + 1,
  );
  await prisma.arquivoEscala.create({
    data: {
      escalaId,
      musicaId: criado.musicaId,
      nome: criado.nome,
      path: criado.path,
      ordem: criado.ordem,
    },
  });
  return responderEscala(escalaId);
}

async function gravarPedacosEFinalizar(
  escalaId: string,
  existente: EscalaComArquivos,
  uploadId: string,
  chunkIndex: number,
  totalChunks: number,
  buffer: Buffer,
  nomeOriginal: string,
  musicaId: string | null,
) {
  if (!Number.isInteger(chunkIndex) || chunkIndex < 0 || totalChunks < 1 || totalChunks > 512) {
    return NextResponse.json({ erro: "Envio em partes inválido." }, { status: 400 });
  }
  if (!buffer.byteLength) {
    return NextResponse.json(
      { erro: "O envio chegou vazio. A rede cortou o arquivo." },
      { status: 400 },
    );
  }
  await gravarPedacoUpload(uploadId, chunkIndex, buffer);
  if (chunkIndex + 1 < totalChunks) {
    return NextResponse.json({ ok: true, pendente: true });
  }
  const montado = await montarPedacosUpload(uploadId, totalChunks);
  return finalizarArquivo(escalaId, existente, nomeOriginal, montado, musicaId);
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

  const url = new URL(request.url);
  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (!contentType.includes("multipart/form-data")) {
      const buffer = Buffer.from(await request.arrayBuffer());
      const uploadId = String(url.searchParams.get("uploadId") ?? "").trim();
      const chunkIndex = Number(url.searchParams.get("chunkIndex"));
      const totalChunks = Number(url.searchParams.get("totalChunks") ?? "1");
      const nomeOriginal = String(url.searchParams.get("nome") ?? "").trim();
      const musicaId = String(url.searchParams.get("musicaId") ?? "").trim() || null;
      if (uploadId) {
        return await gravarPedacosEFinalizar(
          id,
          existente,
          uploadId,
          chunkIndex,
          totalChunks,
          buffer,
          nomeOriginal,
          musicaId,
        );
      }
      return await finalizarArquivo(id, existente, nomeOriginal, buffer, musicaId);
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
    const uploadId = String(form.get("uploadId") ?? url.searchParams.get("uploadId") ?? "").trim();
    const chunkIndex = Number(form.get("chunkIndex") ?? url.searchParams.get("chunkIndex"));
    const totalChunks = Number(
      form.get("totalChunks") ?? url.searchParams.get("totalChunks") ?? "0",
    );
    const nomeOriginal = String(
      form.get("nomeOriginal") ?? url.searchParams.get("nome") ?? "",
    ).trim();

    if (!arquivos.length) {
      return NextResponse.json({ erro: "Envie ao menos um arquivo." }, { status: 400 });
    }

    if (uploadId && Number.isInteger(chunkIndex) && totalChunks > 0) {
      const pedaco = arquivos[0];
      return await gravarPedacosEFinalizar(
        id,
        existente,
        uploadId,
        chunkIndex,
        totalChunks,
        await blobParaBuffer(pedaco),
        nomeOriginal || pedaco.name || "arquivo.mp3",
        musicaIds[0] || null,
      );
    }

    const enviados = arquivos.map((file, indice) => ({
      file,
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
  } catch (falha) {
    console.error("Falha ao gravar arquivo da escala", falha);
    return NextResponse.json(
      { erro: falha instanceof Error ? falha.message : "Não foi possível enviar." },
      { status: 400 },
    );
  }

  return responderEscala(id);
}
