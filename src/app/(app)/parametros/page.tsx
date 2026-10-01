import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { ParametrosAdmin } from "@/components/ParametrosAdmin";
import { exigirAdmin } from "@/lib/acesso";

const grupos = [
  {
    id: "voz",
    titulo: "Voz",
    descricao: "Masculino ou feminino no cadastro dos cantores.",
  },
  {
    id: "afinacao",
    titulo: "Afinação",
    descricao: "Níveis usados para equilibrar a geração automática.",
  },
  {
    id: "tipoVoz",
    titulo: "Tipo de voz",
    descricao: "Classificação vocal, como soprano, tenor ou barítono.",
  },
  {
    id: "leadVocal",
    titulo: "Lead vocal",
    descricao: "Níveis de quem puxa o canto, usados na regra da âncora.",
  },
  {
    id: "backingVocal",
    titulo: "Backing vocal",
    descricao: "Níveis de quem faz o backing, também usados na âncora.",
  },
];

export default async function ParametrosPage() {
  await exigirAdmin();
  const parametros = await prisma.parametro.findMany({
    orderBy: [{ categoria: "asc" }, { ordem: "asc" }],
  });

  return (
    <>
      <PageHeader
        titulo="Parâmetros"
        descricao="Ajuste as opções que aparecem no cadastro dos cantores e na geração da escala."
      />
      <ParametrosAdmin parametros={parametros} grupos={grupos} />
    </>
  );
}
