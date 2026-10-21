import { prisma } from "./prisma";
import { ehIntegranteEngenheiroSom } from "./integrante";

export async function resolverEngenheiroSomId(valor: unknown) {
  const id = String(valor ?? "").trim();
  if (!id) {
    return { ok: true as const, id: null };
  }

  const integrante = await prisma.integrante.findUnique({
    where: { id },
    include: { funcoes: { include: { funcao: true } } },
  });

  if (!integrante?.ativo) {
    return {
      ok: false as const,
      erro: "Engenheiro de som não encontrado.",
    };
  }

  if (
    !ehIntegranteEngenheiroSom({
      perfil: integrante.perfil,
      funcoes: integrante.funcoes.map((item) => item.funcao),
    })
  ) {
    return {
      ok: false as const,
      erro: "O integrante escolhido não tem perfil de engenheiro de som.",
    };
  }

  return { ok: true as const, id: integrante.id };
}
