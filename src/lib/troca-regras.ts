import { ehFuncaoVocal } from "./integrante";
import type { Funcao, Integrante } from "@prisma/client";
import type { IntegranteResumo } from "./types";

type IntegranteComFuncoes = Integrante & {
  funcoes: { funcao: Funcao }[];
};

type FuncaoResumo = { id: string; nome: string; grupo: string };

function funcoesDoIntegrante(
  integrante: IntegranteComFuncoes | IntegranteResumo,
): FuncaoResumo[] {
  return integrante.funcoes.map((item) =>
    "funcao" in item && item.funcao
      ? {
          id: item.funcao.id,
          nome: item.funcao.nome,
          grupo: item.funcao.grupo,
        }
      : (item as FuncaoResumo),
  );
}

export function ehAlocacaoMusico(alocacao: {
  sessao?: string;
  funcao?: { grupo: string; nome: string } | null;
}) {
  if (alocacao.funcao?.grupo === "MUSICO") return true;
  if (alocacao.funcao?.grupo === "CANTOR") return false;
  if (alocacao.sessao === "MUSICO") return true;
  if (alocacao.funcao?.nome && !ehFuncaoVocal(alocacao.funcao.nome)) return true;
  return false;
}

export function podeSerLeadVocal(
  integrante: IntegranteComFuncoes | IntegranteResumo,
) {
  const funcoes = funcoesDoIntegrante(integrante);
  if (funcoes.some((item) => item.nome === "Lead Vocal")) {
    return true;
  }
  return integrante.leadVocal === "SIM" || integrante.leadVocal === "SIM com ressalvas";
}

export function ehFuncaoInstrumento(funcao: { nome: string; grupo?: string }) {
  if (funcao.grupo === "CANTOR") return false;
  if (funcao.grupo === "MUSICO") return !ehFuncaoVocal(funcao.nome);
  return !ehFuncaoVocal(funcao.nome);
}

export function podeExercerInstrumento(
  integrante: IntegranteComFuncoes | IntegranteResumo,
  funcao: FuncaoResumo | null | undefined,
) {
  const funcoes = funcoesDoIntegrante(integrante);
  if (funcao?.id) {
    return funcoes.some((item) => item.id === funcao.id);
  }
  return funcoes.some((item) => ehFuncaoInstrumento(item));
}

export function substitutosParaTroca(
  integrantes: IntegranteResumo[],
  opcoes: {
    sessaoMusico: boolean;
    funcao: FuncaoResumo | null | undefined;
    excetoId?: string;
  },
) {
  return integrantes.filter((pessoa) => {
    if (pessoa.id === opcoes.excetoId) return false;
    if (!pessoa.ativo) return false;
    if (opcoes.sessaoMusico) {
      return podeExercerInstrumento(pessoa, opcoes.funcao);
    }
    return podeSerLeadVocal(pessoa);
  });
}
