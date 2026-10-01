import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recusarSeNaoAdmin } from "@/lib/acesso";
import { configPadrao, gerarEscalas } from "@/lib/algoritmo";
import { deveMostrarParametrosVoz } from "@/lib/integrante";
import { includeEscala, serializarEscala } from "@/lib/serializers";
import type { ConfigGeracao, CriterioId, TratamentoSobra } from "@/lib/types";

export async function POST(request: Request) {
  const { resposta } = await recusarSeNaoAdmin();
  if (resposta) return resposta;

  const corpo = await request.json();
  const titulo = String(corpo.titulo ?? "Escala gerada").trim();
  const dataTexto = String(corpo.data ?? "");
  if (!dataTexto) {
    return NextResponse.json({ erro: "Informe a data da escala." }, { status: 400 });
  }

  const config: ConfigGeracao = {
    ...configPadrao(),
    quantidadeEscalas: Number(corpo.quantidadeEscalas ?? 2),
    quantidadePorEscala: Number(corpo.quantidadePorEscala ?? 4),
    sobra: (corpo.sobra as TratamentoSobra) || "avisar",
    criteriosAtivos: Array.isArray(corpo.criteriosAtivos)
      ? (corpo.criteriosAtivos as CriterioId[])
      : configPadrao().criteriosAtivos,
    prioridade: Array.isArray(corpo.prioridade)
      ? (corpo.prioridade as CriterioId[])
      : configPadrao().prioridade,
    ancora: {
      leadVocal: Array.isArray(corpo.ancora?.leadVocal)
        ? corpo.ancora.leadVocal.map(String)
        : configPadrao().ancora.leadVocal,
      backingVocal: Array.isArray(corpo.ancora?.backingVocal)
        ? corpo.ancora.backingVocal.map(String)
        : configPadrao().ancora.backingVocal,
    },
  };

  const integrantes = (
    await prisma.integrante.findMany({
      where: { ativo: true },
      include: { funcoes: { include: { funcao: true } } },
      orderBy: { nome: "asc" },
    })
  ).filter((integrante) =>
    deveMostrarParametrosVoz(
      integrante.perfil,
      integrante.funcoes.map((item) => item.funcao),
    ),
  );

  if (!integrantes.length) {
    return NextResponse.json(
      { erro: "Cadastre cantores ativos antes de gerar a escala." },
      { status: 400 },
    );
  }

  const resultado = gerarEscalas(integrantes, config);

  const escala = await prisma.escala.create({
    data: {
      titulo,
      data: new Date(`${dataTexto}T12:00:00.000Z`),
      tipo: "AUTO",
      quantidadeEscalas: config.quantidadeEscalas,
      quantidadePorEscala: config.quantidadePorEscala,
      sobra: config.sobra,
      criterios: JSON.stringify(config),
      avisos: JSON.stringify(resultado.avisos),
      blocos: {
        create: resultado.blocos.map((bloco) => ({
          nome: bloco.nome,
          ordem: bloco.ordem,
          temAncora: bloco.temAncora,
          temHomem: bloco.temHomem,
          somaAfinacao: bloco.somaAfinacao,
          mediaAfinacao: bloco.mediaAfinacao,
          tiposVozDistintos: bloco.tiposVozDistintos,
          alocacoes: {
            create: bloco.integrantes.map((integrante, ordem) => ({
              ordem,
              integranteId: integrante.id,
              sessao: "CANTOR",
            })),
          },
        })),
      },
    },
    include: includeEscala,
  });

  return NextResponse.json({ escala: serializarEscala(escala) }, { status: 201 });
}
