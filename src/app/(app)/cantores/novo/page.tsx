import { CantorForm } from "@/components/CantorForm";
import { Card, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/acesso";

export default async function NovoCantorPage() {
  await exigirAdmin();
  const [parametros, funcoes] = await Promise.all([
    prisma.parametro.findMany({ orderBy: [{ categoria: "asc" }, { ordem: "asc" }] }),
    prisma.funcao.findMany({ orderBy: { ordem: "asc" } }),
  ]);

  return (
    <>
      <PageHeader
        titulo="Novo componente"
        descricao="Preencha a classificação vocal. Esses campos alimentam a geração automática das escalas."
      />
      <Card>
        <CantorForm parametros={parametros} funcoes={funcoes} />
      </Card>
    </>
  );
}
