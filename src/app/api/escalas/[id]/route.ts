import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ehAdmin,
  membroPodeVerEscala,
  recusarSeNaoAdmin,
  recusarSeNaoAutenticado,
} from "@/lib/acesso";
import { includeEscala, serializarEscala } from "@/lib/serializers";
import { configPadrao, recalcularBloco } from "@/lib/algoritmo";
import type { ConfigGeracao } from "@/lib/types";
import { apagarPastaEscala } from "@/lib/arquivo-escala";
import { cookies } from "next/headers";
import { COOKIE_FUSO, dispararLimpezaArquivos } from "@/lib/limpeza-arquivos";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { sessao, resposta } = await recusarSeNaoAutenticado();
  if (resposta || !sessao) return resposta;

  const { id } = await params;
  dispararLimpezaArquivos((await cookies()).get(COOKIE_FUSO)?.value);
  const escala = await prisma.escala.findUnique({
    where: { id },
    include: includeEscala,
  });
  if (!escala) {
    return NextResponse.json({ erro: "Escala não encontrada." }, { status: 404 });
  }
  if (!ehAdmin(sessao) && !(await membroPodeVerEscala(id))) {
    return NextResponse.json({ erro: "Escala não encontrada." }, { status: 404 });
  }
  return NextResponse.json({ escala: serializarEscala(escala) });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { resposta } = await recusarSeNaoAdmin();
  if (resposta) return resposta;

  const { id } = await params;
  const corpo = await request.json();

  const atual = await prisma.escala.findUnique({ where: { id } });
  if (!atual) {
    return NextResponse.json({ erro: "Escala não encontrada." }, { status: 404 });
  }

  let config = configPadrao();
  if (atual.criterios) {
    try {
      config = { ...config, ...(JSON.parse(atual.criterios) as ConfigGeracao) };
    } catch {
      /* mantém padrão */
    }
  }

  if (Array.isArray(corpo.blocos)) {
    await prisma.bloco.deleteMany({ where: { escalaId: id } });

    const integranteIds = [
      ...new Set(
        corpo.blocos.flatMap((bloco: { alocacoes?: { integranteId: string }[] }) =>
          (bloco.alocacoes ?? []).map((a) => a.integranteId),
        ),
      ),
    ] as string[];
    const integrantes = await prisma.integrante.findMany({
      where: { id: { in: integranteIds } },
    });
    const mapa = new Map(integrantes.map((i) => [i.id, i]));

    await prisma.escala.update({
      where: { id },
      data: {
        titulo: corpo.titulo !== undefined ? String(corpo.titulo) : undefined,
        data: corpo.data ? new Date(`${corpo.data}T12:00:00.000Z`) : undefined,
        especial:
          corpo.especial !== undefined ? Boolean(corpo.especial) : undefined,
        blocos: {
          create: corpo.blocos.map(
            (
              bloco: {
                nome: string;
                direcao?: string;
                alocacoes?: {
                  integranteId: string;
                  funcaoId?: string | null;
                  musicaId?: string | null;
                  sessao?: string | null;
                }[];
              },
              indice: number,
            ) => {
              const pessoas = (bloco.alocacoes ?? [])
                .map((linha) => mapa.get(linha.integranteId))
                .filter(Boolean)
                .map((i) => ({
                  id: i!.id,
                  nome: i!.nome,
                  voz: i!.voz,
                  afinacao: i!.afinacao,
                  tipoVoz: i!.tipoVoz,
                  leadVocal: i!.leadVocal,
                  backingVocal: i!.backingVocal,
                }));
              const m = recalcularBloco(pessoas, config);
              return {
                nome: String(bloco.nome || `BLOCO ${indice + 1}`).toUpperCase(),
                direcao: String(bloco.direcao ?? "").trim(),
                ordem: indice,
                ...m,
                alocacoes: {
                  create: (bloco.alocacoes ?? []).map((linha, ordem) => ({
                    ordem,
                    integranteId: linha.integranteId,
                    funcaoId: linha.funcaoId || null,
                    musicaId:
                      linha.sessao === "MUSICO" ? null : linha.musicaId || null,
                    sessao: linha.sessao === "MUSICO" ? "MUSICO" : "CANTOR",
                  })),
                },
              };
            },
          ),
        },
      },
    });
  } else {
    await prisma.escala.update({
      where: { id },
      data: {
        titulo: corpo.titulo !== undefined ? String(corpo.titulo) : undefined,
        data: corpo.data ? new Date(`${corpo.data}T12:00:00.000Z`) : undefined,
        especial:
          corpo.especial !== undefined ? Boolean(corpo.especial) : undefined,
      },
    });
  }

  const escala = await prisma.escala.findUniqueOrThrow({
    where: { id },
    include: includeEscala,
  });
  return NextResponse.json({ escala: serializarEscala(escala) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { resposta } = await recusarSeNaoAdmin();
  if (resposta) return resposta;

  const { id } = await params;
  await apagarPastaEscala(id);
  await prisma.escala.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
