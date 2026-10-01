import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  escolherEscalasDaSemana,
  ehAdmin,
  recusarSeNaoAdmin,
  recusarSeNaoAutenticado,
  validarSessaoApi,
} from "@/lib/acesso";
import { includeEscala, serializarEscala } from "@/lib/serializers";
import { configPadrao, recalcularBloco } from "@/lib/algoritmo";
import { cookies } from "next/headers";
import { COOKIE_FUSO, dispararLimpezaArquivos } from "@/lib/limpeza-arquivos";

type LinhaManual = {
  integranteId: string;
  funcaoId?: string | null;
  musicaId?: string | null;
  sessao?: string | null;
};

type BlocoManual = {
  nome: string;
  direcao?: string;
  alocacoes: LinhaManual[];
};

export async function GET() {
  const auth = await recusarSeNaoAutenticado();
  const gate = validarSessaoApi(auth.resposta, auth.sessao);
  if (!gate.ok) return gate.resposta;
  const sessao = gate.sessao;

  dispararLimpezaArquivos((await cookies()).get(COOKIE_FUSO)?.value);

  const escalas = await prisma.escala.findMany({
    include: includeEscala,
    orderBy: { data: "desc" },
  });

  const visiveis = ehAdmin(sessao)
    ? escalas
    : escolherEscalasDaSemana(escalas.filter((item) => !item.especial));

  return NextResponse.json({
    escalas: visiveis.map(serializarEscala),
  });
}

export async function POST(request: Request) {
  const { resposta } = await recusarSeNaoAdmin();
  if (resposta) return resposta;

  const corpo = await request.json();
  const titulo = String(corpo.titulo ?? "").trim();
  const dataTexto = String(corpo.data ?? "");
  const blocos: BlocoManual[] = Array.isArray(corpo.blocos) ? corpo.blocos : [];

  if (!titulo || !dataTexto) {
    return NextResponse.json(
      { erro: "Informe título e data da escala." },
      { status: 400 },
    );
  }

  if (!blocos.length) {
    return NextResponse.json(
      { erro: "Adicione ao menos um culto ou bloco." },
      { status: 400 },
    );
  }

  const integranteIds = [
    ...new Set(blocos.flatMap((b) => b.alocacoes.map((a) => a.integranteId))),
  ];
  const integrantes = await prisma.integrante.findMany({
    where: { id: { in: integranteIds } },
  });
  const mapa = new Map(integrantes.map((i) => [i.id, i]));
  const config = configPadrao();

  const escala = await prisma.escala.create({
    data: {
      titulo,
      data: new Date(`${dataTexto}T12:00:00.000Z`),
      tipo: "MANUAL",
      especial: Boolean(corpo.especial),
      blocos: {
        create: blocos.map((bloco, indice) => {
          const pessoas = bloco.alocacoes
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
            nome: String(bloco.nome || `CULTO ${indice + 1}`).toUpperCase(),
            direcao: String(bloco.direcao ?? "").trim(),
            ordem: indice,
            ...m,
            alocacoes: {
              create: bloco.alocacoes.map((linha, ordem) => ({
                ordem,
                integranteId: linha.integranteId,
                funcaoId: linha.funcaoId || null,
                musicaId:
                  linha.sessao === "MUSICO" ? null : linha.musicaId || null,
                sessao: linha.sessao === "MUSICO" ? "MUSICO" : "CANTOR",
              })),
            },
          };
        }),
      },
    },
    include: includeEscala,
  });

  return NextResponse.json({ escala: serializarEscala(escala) }, { status: 201 });
}
