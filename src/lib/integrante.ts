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
      integrante.funcoes.some((item) =>
        ehFuncaoEngenheiroSom(item.funcao.nome),
      )
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
  if (perfil !== "MUSICO") return true;
  return funcoes.some((funcao) => ehFuncaoVocal(funcao.nome));
}
