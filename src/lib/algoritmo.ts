import type { CriterioId, ConfigGeracao, TratamentoSobra } from "./types";

export type IntegranteAlgoritmo = {
  id: string;
  nome: string;
  voz: string;
  afinacao: number;
  tipoVoz: string;
  leadVocal: string;
  backingVocal: string;
};

export type BlocoGerado = {
  nome: string;
  ordem: number;
  temAncora: boolean;
  temHomem: boolean;
  somaAfinacao: number;
  mediaAfinacao: number;
  tiposVozDistintos: number;
  integrantes: IntegranteAlgoritmo[];
};

export type ResultadoGeracao = {
  blocos: BlocoGerado[];
  avisos: string[];
};

const VOZES_MASCULINAS = new Set(["Masculino", "masculino", "Homem", "homem"]);

export function ehHomem(integrante: IntegranteAlgoritmo) {
  return VOZES_MASCULINAS.has(integrante.voz);
}

export function ehAncora(
  integrante: IntegranteAlgoritmo,
  regra: ConfigGeracao["ancora"],
) {
  return (
    regra.leadVocal.includes(integrante.leadVocal) &&
    regra.backingVocal.includes(integrante.backingVocal)
  );
}

export function configPadrao(): ConfigGeracao {
  return {
    quantidadeEscalas: 2,
    quantidadePorEscala: 4,
    sobra: "avisar",
    criteriosAtivos: ["ancora", "genero", "diversidade", "afinacao"],
    prioridade: ["ancora", "genero", "afinacao", "diversidade"],
    ancora: {
      leadVocal: ["SIM"],
      backingVocal: ["Sabe cantar em vozes"],
    },
  };
}

function somaAfinacao(membros: IntegranteAlgoritmo[]) {
  return membros.reduce((acc, atual) => acc + atual.afinacao, 0);
}

function temTipo(membros: IntegranteAlgoritmo[], tipo: string) {
  return membros.some((membro) => membro.tipoVoz === tipo);
}

function compararCriterio(
  criterio: CriterioId,
  candidato: IntegranteAlgoritmo,
  a: IntegranteAlgoritmo[],
  b: IntegranteAlgoritmo[],
) {
  if (criterio === "genero" && ehHomem(candidato)) {
    const aPrecisa = !a.some(ehHomem);
    const bPrecisa = !b.some(ehHomem);
    if (aPrecisa !== bPrecisa) return aPrecisa ? -1 : 1;
  }

  if (criterio === "diversidade") {
    const aTem = temTipo(a, candidato.tipoVoz);
    const bTem = temTipo(b, candidato.tipoVoz);
    if (aTem !== bTem) return aTem ? 1 : -1;
  }

  if (criterio === "afinacao") {
    return somaAfinacao(a) - somaAfinacao(b);
  }

  return 0;
}

function escolherBloco(
  candidato: IntegranteAlgoritmo,
  blocos: { membros: IntegranteAlgoritmo[] }[],
  config: ConfigGeracao,
) {
  const prioridade = config.prioridade.filter((id) =>
    config.criteriosAtivos.includes(id),
  );

  return blocos
    .map((bloco, indice) => ({ bloco, indice }))
    .sort((x, y) => {
      for (const criterio of prioridade) {
        const cmp = compararCriterio(
          criterio,
          candidato,
          x.bloco.membros,
          y.bloco.membros,
        );
        if (cmp !== 0) return cmp;
      }
      return x.bloco.membros.length - y.bloco.membros.length;
    })[0].bloco;
}

function metricas(membros: IntegranteAlgoritmo[], config: ConfigGeracao) {
  const soma = somaAfinacao(membros);
  const tipos = new Set(membros.map((m) => m.tipoVoz));
  return {
    temAncora: membros.some((m) => ehAncora(m, config.ancora)),
    temHomem: membros.some(ehHomem),
    somaAfinacao: soma,
    mediaAfinacao: membros.length ? Number((soma / membros.length).toFixed(2)) : 0,
    tiposVozDistintos: tipos.size,
  };
}

export function gerarEscalas(
  integrantes: IntegranteAlgoritmo[],
  entrada: Partial<ConfigGeracao> = {},
): ResultadoGeracao {
  const config: ConfigGeracao = { ...configPadrao(), ...entrada };
  const avisos: string[] = [];
  const N = Math.max(1, Math.floor(config.quantidadeEscalas));
  const M = Math.max(1, Math.floor(config.quantidadePorEscala));
  const necessarios = N * M;
  const pool = integrantes.filter(Boolean);
  const sobra: TratamentoSobra = config.sobra;

  if (pool.length < necessarios) {
    avisos.push(
      `Há ${pool.length} integrantes ativos para ${necessarios} vagas (${N} × ${M}). As escalas serão preenchidas com o que houver.`,
    );
  } else if (pool.length > necessarios) {
    const extra = pool.length - necessarios;
    if (sobra === "avisar" || sobra === "descartar") {
      avisos.push(
        `${extra} integrante(s) ficarão de fora desta geração (${sobra === "descartar" ? "sobra descartada" : "sobra avisada"}).`,
      );
    } else {
      avisos.push(
        `${extra} integrante(s) extras serão distribuídos além do tamanho-base de cada escala.`,
      );
    }
  }

  const blocos = Array.from({ length: N }, (_, indice) => ({
    nome: N === 1 ? "ESCALA" : `ESCALA ${indice + 1}`,
    ordem: indice,
    membros: [] as IntegranteAlgoritmo[],
    semAncoraSinalizada: false,
  }));

  const ancoras = pool.filter((p) => ehAncora(p, config.ancora));
  const demais = pool.filter((p) => !ehAncora(p, config.ancora));

  if (config.criteriosAtivos.includes("ancora")) {
    ancoras.forEach((ancora, indice) => {
      if (indice < N) {
        blocos[indice].membros.push(ancora);
      }
    });

    if (ancoras.length < N) {
      for (let i = ancoras.length; i < N; i += 1) {
        blocos[i].semAncoraSinalizada = true;
        avisos.push(
          `${blocos[i].nome} ficou sem âncora (Lead Vocal = ${config.ancora.leadVocal.join(" / ")} e Backing = ${config.ancora.backingVocal.join(" / ")}).`,
        );
      }
    }
  }

  const alocados = new Set(blocos.flatMap((b) => b.membros.map((m) => m.id)));
  const restantes = [
    ...ancoras.filter((a) => !alocados.has(a.id)),
    ...demais.filter((d) => !alocados.has(d.id)),
  ];

  const limite = (qtd: number) => {
    if (sobra === "distribuir") return false;
    return qtd >= M;
  };

  for (const candidato of restantes) {
    const abertos = blocos.filter((b) => !limite(b.membros.length));
    if (abertos.length === 0) break;
    escolherBloco(candidato, abertos, config).membros.push(candidato);
  }

  if (config.criteriosAtivos.includes("genero")) {
    const homens = pool.filter(ehHomem).length;
    if (homens < N) {
      avisos.push(
        `Há ${homens} homem(ns) para ${N} escala(s). Nem todas puderam receber um homem.`,
      );
    }
  }

  return {
    avisos,
    blocos: blocos.map((bloco) => {
      const m = metricas(bloco.membros, config);
      return {
        nome: bloco.nome,
        ordem: bloco.ordem,
        integrantes: bloco.membros,
        ...m,
      };
    }),
  };
}

export function recalcularBloco(
  integrantes: IntegranteAlgoritmo[],
  config: ConfigGeracao,
) {
  return metricas(integrantes, config);
}
