import { prisma } from "./prisma";
import { serializarMusica } from "./musica";
import { serializarIntegrante } from "./serializers";
import { ehAlocacaoMusico, podeSerLeadVocal } from "./troca-regras";
import type { Funcao, Integrante, Musica, PedidoTroca } from "@prisma/client";

export {
  ehAlocacaoMusico,
  ehFuncaoInstrumento,
  podeExercerInstrumento,
  podeSerLeadVocal,
  substitutosParaTroca,
} from "./troca-regras";

export async function alocacoesComPedidoPendente(integranteId: string) {
  const pedidos = await prisma.pedidoTroca.findMany({
    where: { solicitanteId: integranteId, status: "PENDENTE" },
    select: { alocacaoId: true },
  });
  return pedidos.map((pedido) => pedido.alocacaoId);
}

export async function opcoesPedidoTroca(excetoIntegranteId?: string) {
  const [musicas, integrantes] = await Promise.all([
    prisma.musica.findMany({
      where: { ativo: true },
      orderBy: { titulo: "asc" },
    }),
    prisma.integrante.findMany({
      where: { ativo: true },
      include: { funcoes: { include: { funcao: true } } },
      orderBy: { nome: "asc" },
    }),
  ]);

  const serializados = integrantes.map(serializarIntegrante);

  return {
    musicas: musicas.map(serializarMusica),
    integrantes: serializados,
    leads: serializados.filter(
      (item) => item.id !== excetoIntegranteId && podeSerLeadVocal(item),
    ),
  };
}

export const includePedidoTroca = {
  solicitante: true,
  substituto: true,
  musica: true,
  alocacao: {
    include: {
      integrante: true,
      funcao: true,
      bloco: { include: { escala: true } },
    },
  },
} as const;

type PedidoCompleto = PedidoTroca & {
  solicitante: Integrante;
  substituto: Integrante;
  musica: Musica | null;
  alocacao: {
    id: string;
    sessao: string;
    integrante: Integrante;
    funcao: Funcao | null;
    bloco: { nome: string; escala: { id: string; titulo: string; data: Date } };
  };
};

export function serializarPedidoTroca(pedido: PedidoCompleto) {
  const sessaoMusico = ehAlocacaoMusico(pedido.alocacao);
  return {
    id: pedido.id,
    status: pedido.status,
    alocacaoId: pedido.alocacaoId,
    solicitante: { id: pedido.solicitante.id, nome: pedido.solicitante.nome },
    substituto: { id: pedido.substituto.id, nome: pedido.substituto.nome },
    musica: pedido.musica
      ? { id: pedido.musica.id, titulo: pedido.musica.titulo }
      : null,
    culto: pedido.alocacao.bloco.nome,
    escalaId: pedido.alocacao.bloco.escala.id,
    escalaTitulo: pedido.alocacao.bloco.escala.titulo,
    escalaData: pedido.alocacao.bloco.escala.data.toISOString(),
    papelAtual: pedido.alocacao.funcao?.nome ?? (sessaoMusico ? "Instrumento" : "Cantor"),
    funcao: pedido.alocacao.funcao
      ? {
          id: pedido.alocacao.funcao.id,
          nome: pedido.alocacao.funcao.nome,
          grupo: pedido.alocacao.funcao.grupo,
        }
      : null,
    sessaoMusico,
    nomeAtual: pedido.alocacao.integrante.nome,
    createdAt: pedido.createdAt.toISOString(),
  };
}
