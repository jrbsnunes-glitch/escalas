import { unlink } from "node:fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ehAdmin,
  membroPodeVerEscala,
  recusarSeNaoAdmin,
  recusarSeNaoAutenticado,
  validarSessaoApi,
} from "@/lib/acesso";
import { includeEscala, serializarEscala } from "@/lib/serializers";
import {
  localizarArquivoNoDisco,
  mimeArquivo,
  lerArquivoEscala,
} from "@/lib/arquivo-escala";
import { nomeArquivoSeguro } from "@/lib/musica";

function cabecalhoArquivo(nome: string, inline: boolean) {
  const ascii = nomeArquivoSeguro(nome) || "arquivo";
  const tipo = inline ? "inline" : "attachment";
  return `${tipo}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(nome)}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; arquivoId: string }> },
) {
  const auth = await recusarSeNaoAutenticado();
  const gate = validarSessaoApi(auth.resposta, auth.sessao);
  if (!gate.ok) return gate.resposta;

  const { id, arquivoId } = await params;
  if (!ehAdmin(gate.sessao) && !(await membroPodeVerEscala(id))) {
    return NextResponse.json({ erro: "Arquivo não encontrado." }, { status: 404 });
  }

  const arquivo = await prisma.arquivoEscala.findFirst({
    where: { id: arquivoId, escalaId: id },
  });
  if (!arquivo) {
    return NextResponse.json({ erro: "Arquivo não encontrado." }, { status: 404 });
  }

  const lido = await lerArquivoEscala(arquivo);
  if (!lido) {
    return NextResponse.json(
      { erro: "O arquivo não está mais no servidor." },
      { status: 404 },
    );
  }

  const tipo = mimeArquivo(arquivo.nome);
  const total = lido.buffer.byteLength;
  const range = request.headers.get("range");
  const forcarDownload = new URL(request.url).searchParams.has("download");
  const headersBase = {
    "Accept-Ranges": "bytes",
    "Content-Type": tipo,
    "Content-Disposition": cabecalhoArquivo(arquivo.nome, !forcarDownload),
    "Cache-Control": "private, no-store",
  };

  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${total}` },
      });
    }
    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Number(match[2]) : total - 1;
    if (start >= total || end >= total || start > end) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${total}` },
      });
    }
    const fatia = Uint8Array.from(lido.buffer.subarray(start, end + 1));
    return new NextResponse(fatia, {
      status: 206,
      headers: {
        ...headersBase,
        "Content-Range": `bytes ${start}-${end}/${total}`,
        "Content-Length": String(fatia.byteLength),
      },
    });
  }

  return new NextResponse(Uint8Array.from(lido.buffer), {
    status: 200,
    headers: {
      ...headersBase,
      "Content-Length": String(total),
    },
  });
}

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

  const disco = await localizarArquivoNoDisco(arquivo);
  await prisma.arquivoEscala.delete({ where: { id: arquivoId } });
  if (disco) await unlink(disco).catch(() => undefined);

  const escala = await prisma.escala.findUniqueOrThrow({
    where: { id },
    include: includeEscala,
  });
  return NextResponse.json({ escala: serializarEscala(escala) });
}
