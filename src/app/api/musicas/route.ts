import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recusarSeNaoAdmin } from "@/lib/acesso";
import { normalizarYoutube, serializarMusica } from "@/lib/musica";

export async function GET() {
  const { resposta } = await recusarSeNaoAdmin();
  if (resposta) return resposta;

  const musicas = await prisma.musica.findMany({
    orderBy: [{ ativo: "desc" }, { titulo: "asc" }],
  });
  return NextResponse.json({ musicas: musicas.map(serializarMusica) });
}

export async function POST(request: Request) {
  const { resposta } = await recusarSeNaoAdmin();
  if (resposta) return resposta;

  const corpo = await request.json();
  const titulo = String(corpo.titulo ?? "").trim();
  if (!titulo) {
    return NextResponse.json({ erro: "Informe o título da música." }, { status: 400 });
  }

  const youtubeUrl = normalizarYoutube(String(corpo.youtubeUrl ?? ""));
  if (youtubeUrl === null) {
    return NextResponse.json(
      { erro: "Informe um link válido do YouTube." },
      { status: 400 },
    );
  }

  const musica = await prisma.musica.create({
    data: { titulo, youtubeUrl },
  });
  return NextResponse.json({ musica: serializarMusica(musica) }, { status: 201 });
}
