import { EscalaManualForm } from "@/components/EscalaManualForm";
import { Card, PageHeader } from "@/components/ui";
import { serializarMusica } from "@/lib/musica";
import { prisma } from "@/lib/prisma";
import { serializarIntegrante } from "@/lib/serializers";
import { exigirAdmin } from "@/lib/acesso";

export default async function EscalaManualPage({
  searchParams,
}: {
  searchParams: Promise<{ especial?: string }>;
}) {
  await exigirAdmin();
  const especial = (await searchParams).especial === "1";
  const [cantores, funcoes, musicas] = await Promise.all([
    prisma.integrante.findMany({
      where: { ativo: true },
      include: { funcoes: { include: { funcao: true } } },
      orderBy: { nome: "asc" },
    }),
    prisma.funcao.findMany({ where: { ativo: true }, orderBy: { ordem: "asc" } }),
    prisma.musica.findMany({
      where: { ativo: true },
      orderBy: { titulo: "asc" },
    }),
  ]);

  return (
    <>
      <PageHeader
        titulo={especial ? "Montar escala especial" : "Montar escala manual"}
        descricao={
          especial
            ? "Monte a programação especial com músicos, cantores e músicas do repertório."
            : "Monte músicos e cantores em sessões separadas. A legenda usa o cabeçalho + data."
        }
      />
      <Card>
        <EscalaManualForm
          integrantes={cantores.map(serializarIntegrante)}
          funcoes={funcoes}
          musicas={musicas.map(serializarMusica)}
          especialInicial={especial}
        />
      </Card>
    </>
  );
}
