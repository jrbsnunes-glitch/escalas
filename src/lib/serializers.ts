import type { Funcao, Integrante, Prisma } from "@prisma/client";
import { urlDownloadArquivo } from "./arquivo-escala";
import { serializarMusica } from "./musica";
import type { ConfigGeracao, EscalaDetalhe, IntegranteResumo, SessaoEscala } from "./types";

type IntegranteComFuncoes = Integrante & {
  funcoes: { funcao: Funcao }[];
};

export function serializarIntegrante(integrante: IntegranteComFuncoes) {
  return {
    id: integrante.id,
    nome: integrante.nome,
    perfil: (integrante.perfil as IntegranteResumo["perfil"]) || "CANTOR",
    voz: integrante.voz,
    afinacao: integrante.afinacao,
    tipoVoz: integrante.tipoVoz,
    leadVocal: integrante.leadVocal,
    backingVocal: integrante.backingVocal,
    nascimento: integrante.nascimento ? integrante.nascimento.toISOString().slice(0, 10) : "",
    ativo: integrante.ativo,
    funcoes: integrante.funcoes.map((item) => ({
      id: item.funcao.id,
      nome: item.funcao.nome,
      grupo: item.funcao.grupo,
    })),
  };
}

export const includeEscala = {
  arquivos: { orderBy: [{ ordem: "asc" as const }, { createdAt: "asc" as const }] },
  blocos: {
    include: {
      alocacoes: {
        include: {
          integrante: { include: { funcoes: { include: { funcao: true } } } },
          funcao: true,
          musica: true,
        },
      },
    },
  },
} satisfies Prisma.EscalaInclude;

export type EscalaComInclude = Prisma.EscalaGetPayload<{
  include: typeof includeEscala;
}>;

export function serializarEscala(escala: EscalaComInclude): EscalaDetalhe {
  let criterios: ConfigGeracao | null = null;
  let avisos: string[] = [];

  if (escala.criterios) {
    try {
      criterios = JSON.parse(escala.criterios) as ConfigGeracao;
    } catch {
      criterios = null;
    }
  }

  if (escala.avisos) {
    try {
      avisos = JSON.parse(escala.avisos) as string[];
    } catch {
      avisos = [];
    }
  }

  return {
    id: escala.id,
    titulo: escala.titulo,
    data: escala.data.toISOString(),
    tipo: escala.tipo as EscalaDetalhe["tipo"],
    especial: Boolean(escala.especial),
    quantidadeEscalas: escala.quantidadeEscalas,
    quantidadePorEscala: escala.quantidadePorEscala,
    sobra: escala.sobra,
    criterios,
    avisos,
    createdAt: escala.createdAt.toISOString(),
    arquivos: (escala.arquivos ?? [])
      .slice()
      .sort((a, b) => a.ordem - b.ordem)
      .map((arquivo) => ({
        id: arquivo.id,
        nome: arquivo.nome,
        path: urlDownloadArquivo(escala.id, arquivo.id),
        musicaId: arquivo.musicaId ?? null,
      })),
    blocos: escala.blocos
      .slice()
      .sort((a, b) => a.ordem - b.ordem)
      .map((bloco) => ({
        id: bloco.id,
        nome: bloco.nome,
        direcao: bloco.direcao ?? "",
        ordem: bloco.ordem,
        temAncora: bloco.temAncora,
        temHomem: bloco.temHomem,
        somaAfinacao: bloco.somaAfinacao,
        mediaAfinacao: bloco.mediaAfinacao,
        tiposVozDistintos: bloco.tiposVozDistintos,
        alocacoes: bloco.alocacoes
          .slice()
          .sort((a, b) => a.ordem - b.ordem)
          .map((alocacao) => ({
            id: alocacao.id,
            ordem: alocacao.ordem,
            sessao: (alocacao.sessao as SessaoEscala) || "CANTOR",
            integrante: serializarIntegrante(alocacao.integrante),
            funcao: alocacao.funcao
              ? {
                  id: alocacao.funcao.id,
                  nome: alocacao.funcao.nome,
                  grupo: alocacao.funcao.grupo,
                }
              : null,
            musica: alocacao.musica ? serializarMusica(alocacao.musica) : null,
          })),
      })),
  };
}

