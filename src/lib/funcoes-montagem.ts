import { ehFuncaoEngenheiroSom } from "./integrante";
import { prisma } from "./prisma";

export async function alinharFuncoesEngenheiroSom() {
  const funcoes = await prisma.funcao.findMany();
  const ids = funcoes
    .filter((funcao) => ehFuncaoEngenheiroSom(funcao.nome) && funcao.grupo !== "ENGENHEIRO")
    .map((funcao) => funcao.id);
  if (!ids.length) return;
  await prisma.funcao.updateMany({
    where: { id: { in: ids } },
    data: { grupo: "ENGENHEIRO" },
  });
}
