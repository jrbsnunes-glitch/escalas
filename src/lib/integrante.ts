function normalizarNomeFuncao(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function ehFuncaoVocal(nome: string) {
  const normalizado = normalizarNomeFuncao(nome);
  return normalizado === "lead vocal" || normalizado === "backing vocal";
}

export function ehFuncaoEngenheiroSom(nome: string) {
  const normalizado = normalizarNomeFuncao(nome);
  if (normalizado.includes("engenheiro") && normalizado.includes("som")) {
    return true;
  }
  if (normalizado.includes("sonoplast")) return true;
  if (normalizado === "mesa de som" || normalizado === "operador de som") {
    return true;
  }
  return false;
}

export type IntegranteContagemPapel = {
  perfil: string;
  funcoes: { funcao: { nome: string } }[];
};

export function ehPerfilEngenheiroSom(perfil: string) {
  return perfil === "ENGENHEIRO";
}

export function ehIntegranteEngenheiroSom(pessoa: {
  perfil: string;
  funcoes?: { nome: string }[];
}) {
  return ehPerfilEngenheiroSom(pessoa.perfil);
}

export function ehFuncaoDeMusico(funcao: { nome: string; grupo: string }) {
  if (funcao.grupo === "ENGENHEIRO" || ehFuncaoEngenheiroSom(funcao.nome)) {
    return false;
  }
  return funcao.grupo === "MUSICO";
}

export function rotuloPerfilMinisterio(perfil: string) {
  if (perfil === "MUSICO") return "Músico";
  if (perfil === "AMBOS") return "Cantor e músico";
  if (perfil === "ENGENHEIRO") return "Engenheiro de som";
  return "Cantor";
}

export function contagemComponentesAtivos(integrantes: IntegranteContagemPapel[]) {
  let cantores = 0;
  let musicos = 0;
  let engenheirosSom = 0;

  for (const integrante of integrantes) {
    if (integrante.perfil === "CANTOR" || integrante.perfil === "AMBOS") {
      cantores += 1;
    }
    if (integrante.perfil === "MUSICO" || integrante.perfil === "AMBOS") {
      musicos += 1;
    }
    if (
      ehIntegranteEngenheiroSom({
        perfil: integrante.perfil,
        funcoes: integrante.funcoes.map((item) => item.funcao),
      })
    ) {
      engenheirosSom += 1;
    }
  }

  return {
    total: integrantes.length,
    cantores,
    musicos,
    engenheirosSom,
  };
}

export function deveMostrarParametrosVoz(
  perfil: string,
  funcoes: { nome: string }[],
) {
  if (perfil === "MUSICO" || perfil === "ENGENHEIRO") {
    return funcoes.some((funcao) => ehFuncaoVocal(funcao.nome));
  }
  return true;
}
