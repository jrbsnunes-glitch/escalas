import { ListaComponentes } from "@/components/ListaComponentes";
import { BotaoLink, Empty, PageHeader } from "@/components/ui";
import { deveMostrarParametrosVoz } from "@/lib/integrante";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/acesso";

export default async function CantoresPage() {
  await exigirAdmin();
  const cantores = await prisma.integrante.findMany({
    include: { funcoes: { include: { funcao: true } } },
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
  });

  return (
    <>
      <PageHeader
        titulo="Componentes"
        descricao="Quem canta e toca no ministério. Inative quem não entra na escala; o cadastro continua salvo."
        acao={<BotaoLink href="/cantores/novo">Novo componente</BotaoLink>}
      />

      {cantores.length === 0 ? (
        <Empty
          titulo="Nenhum componente cadastrado"
          descricao="Comece pelo cadastro para montar as escalas."
        />
      ) : (
        <ListaComponentes
          componentes={cantores.map((cantor) => ({
            id: cantor.id,
            nome: cantor.nome,
            ativo: cantor.ativo,
            voz: cantor.voz,
            tipoVoz: cantor.tipoVoz,
            afinacao: cantor.afinacao,
            leadVocal: cantor.leadVocal,
            backingVocal: cantor.backingVocal,
            funcoes: cantor.funcoes.map((item) => item.funcao.nome),
            mostraVoz: deveMostrarParametrosVoz(
              cantor.perfil,
              cantor.funcoes.map((item) => item.funcao),
            ),
          }))}
        />
      )}
    </>
  );
}
