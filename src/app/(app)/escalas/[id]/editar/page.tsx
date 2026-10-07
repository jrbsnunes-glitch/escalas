import { notFound } from "next/navigation";
import { EscalaManualForm } from "@/components/EscalaManualForm";
import { Card, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { serializarMusica } from "@/lib/musica";
import { includeEscala, serializarEscala, serializarIntegrante } from "@/lib/serializers";
import { sessaoDaAlocacao } from "@/lib/escala";

import { EscalaIdRotulo } from "@/components/EscalaIdRotulo";
import { exigirAdmin } from "@/lib/acesso";

export default async function EditarEscalaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirAdmin();
  const { id } = await params;
  const [registro, cantores, funcoes, musicas] = await Promise.all([
    prisma.escala.findUnique({ where: { id }, include: includeEscala }),
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

  if (!registro) notFound();
  const escala = serializarEscala(registro);
  const data = escala.data.slice(0, 10);

  return (
    <>
      <PageHeader
        titulo="Ajustar escala"
        descricao="Troque nomes entre blocos ou funções. As métricas são recalculadas ao salvar."
      />
      <EscalaIdRotulo id={escala.id} />
      <Card>
        <EscalaManualForm
          escalaId={escala.id}
          integrantes={cantores.map(serializarIntegrante)}
          funcoes={funcoes}
          musicas={musicas.map(serializarMusica)}
          inicial={{
            titulo: escala.titulo,
            data,
            especial: escala.especial,
            arquivos: escala.arquivos,
            blocos: escala.blocos.map((bloco) => ({
              nome: bloco.nome,
              direcao: bloco.direcao,
              alocacoes: bloco.alocacoes.map((alocacao) => ({
                integranteId: alocacao.integrante.id,
                funcaoId: alocacao.funcao?.id ?? "",
                sessao: sessaoDaAlocacao(alocacao),
                musicaId: alocacao.musica?.id ?? "",
              })),
            })),
          }}
        />
      </Card>
    </>
  );
}
