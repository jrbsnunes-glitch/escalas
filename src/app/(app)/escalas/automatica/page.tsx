import { GeracaoAutomatica } from "@/components/GeracaoAutomatica";
import { Card, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { configPadrao } from "@/lib/algoritmo";
import { exigirAdmin } from "@/lib/acesso";
import { serializarIntegrante } from "@/lib/serializers";

export default async function EscalaAutomaticaPage() {
  await exigirAdmin();
  const [cantores, parametros, integrantes] = await Promise.all([
    prisma.integrante.count({ where: { ativo: true } }),
    prisma.parametro.findMany({
      where: { ativo: true },
      orderBy: [{ categoria: "asc" }, { ordem: "asc" }],
    }),
    prisma.integrante.findMany({
      where: { ativo: true },
      include: { funcoes: { include: { funcao: true } } },
      orderBy: { nome: "asc" },
    }),
  ]);

  return (
    <>
      <PageHeader
        titulo="Gerar escala automática"
        descricao="Defina quantidade, tamanho, sobra e a ordem dos critérios de balanceamento."
      />
      <Card>
        <GeracaoAutomatica
          totalAtivos={cantores}
          parametros={parametros}
          padrao={configPadrao()}
          integrantes={integrantes.map(serializarIntegrante)}
        />
      </Card>
    </>
  );
}
