import { notFound } from "next/navigation";
import { CantorForm } from "@/components/CantorForm";
import { Card, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { serializarIntegrante } from "@/lib/serializers";
import { exigirAdmin } from "@/lib/acesso";

export default async function EditarCantorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirAdmin();
  const { id } = await params;
  const [cantor, parametros, funcoes] = await Promise.all([
    prisma.integrante.findUnique({
      where: { id },
      include: { funcoes: { include: { funcao: true } } },
    }),
    prisma.parametro.findMany({ orderBy: [{ categoria: "asc" }, { ordem: "asc" }] }),
    prisma.funcao.findMany({ orderBy: { ordem: "asc" } }),
  ]);

  if (!cantor) notFound();

  return (
    <>
      <PageHeader
        titulo={cantor.nome}
        descricao="Edite a classificação ou inative o cantor sem apagar o histórico das escalas."
      />
      <Card>
        <CantorForm
          cantor={serializarIntegrante(cantor)}
          parametros={parametros}
          funcoes={funcoes}
        />
      </Card>
    </>
  );
}
