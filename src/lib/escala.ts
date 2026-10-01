import type { AlocacaoResumo, EscalaDetalhe, MusicaResumo, SessaoEscala } from "./types";

export function formatarDataCurta(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

export function formatarDataCompleta(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

const VOZES = new Set(["Lead Vocal", "Backing Vocal", "Vocal"]);

export function cabecalhoEscala(titulo: string, dataIso: string) {
  return `${titulo.trim()} data ${formatarDataCompleta(dataIso)}`;
}

export function sessaoDaAlocacao(alocacao: AlocacaoResumo): SessaoEscala {
  if (alocacao.funcao?.grupo === "MUSICO" || alocacao.funcao?.grupo === "CANTOR") {
    return alocacao.funcao.grupo;
  }
  if (alocacao.sessao === "MUSICO" || alocacao.sessao === "CANTOR") {
    return alocacao.sessao;
  }
  if (alocacao.funcao?.nome && !VOZES.has(alocacao.funcao.nome)) {
    return "MUSICO";
  }
  return "CANTOR";
}

export function alocacoesPorSessao(alocacoes: AlocacaoResumo[]) {
  const ordenadas = alocacoes.slice().sort((a, b) => a.ordem - b.ordem);
  return {
    musicos: ordenadas.filter((item) => sessaoDaAlocacao(item) === "MUSICO"),
    cantores: ordenadas.filter((item) => sessaoDaAlocacao(item) === "CANTOR"),
  };
}

export function rotuloSessao(sessao: SessaoEscala) {
  return sessao === "MUSICO" ? "MÚSICOS" : "CANTORES";
}

export function papelAlocacao(alocacao: AlocacaoResumo) {
  if (alocacao.funcao?.nome) return alocacao.funcao.nome;
  if (sessaoDaAlocacao(alocacao) === "MUSICO") return "Instrumento";
  return alocacao.integrante.tipoVoz || "Cantor";
}

export function musicasDaEscala(escala: EscalaDetalhe): MusicaResumo[] {
  const mapa = new Map<string, MusicaResumo>();
  for (const bloco of escala.blocos) {
    for (const alocacao of bloco.alocacoes) {
      if (alocacao.musica) mapa.set(alocacao.musica.id, alocacao.musica);
    }
  }
  return [...mapa.values()].sort((a, b) =>
    a.titulo.localeCompare(b.titulo, "pt-BR"),
  );
}

export function musicasPorBloco(escala: EscalaDetalhe) {
  return escala.blocos.map((bloco) => {
    const mapa = new Map<string, MusicaResumo>();
    for (const alocacao of bloco.alocacoes) {
      if (alocacao.musica) mapa.set(alocacao.musica.id, alocacao.musica);
    }
    return {
      id: bloco.id,
      nome: bloco.nome,
      musicas: [...mapa.values()],
    };
  });
}
