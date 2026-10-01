import { Card, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { FuncoesAdmin } from "@/components/FuncoesAdmin";
import { exigirAdmin } from "@/lib/acesso";

export default async function FuncoesPage() {
  await exigirAdmin();
  const funcoes = await prisma.funcao.findMany({ orderBy: { ordem: "asc" } });

  return (
    <>
      <PageHeader
        titulo="Funções"
        descricao="Bateria, baixo, teclado, vocal e o que o ministério usar na montagem manual."
      />
      <Card>
        <FuncoesAdmin funcoes={funcoes} />
      </Card>
    </>
  );
}
