export function ehFuncaoVocal(nome: string) {
  const normalizado = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  return normalizado === "lead vocal" || normalizado === "backing vocal";
}

export function deveMostrarParametrosVoz(
  perfil: string,
  funcoes: { nome: string }[],
) {
  if (perfil !== "MUSICO") return true;
  return funcoes.some((funcao) => ehFuncaoVocal(funcao.nome));
}
