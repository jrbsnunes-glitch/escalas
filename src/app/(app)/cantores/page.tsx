import { ImprimirComponentes } from "@/components/ImprimirComponentes";
import { ListaComponentes } from "@/components/ListaComponentes";
import { BotaoLink, Empty, PageHeader } from "@/components/ui";
import { deveMostrarParametrosVoz } from "@/lib/integrante";
import { prisma } from "@/lib/prisma";
import { ehAdmin, exigirAdmin } from "@/lib/acesso";

export default async function CantoresPage() {
  const sessao = await exigirAdmin();
  const admin = ehAdmin(sessao);
  const cantores = await prisma.integrante.findMany({
    include: { funcoes: { include: { funcao: true } } },
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
  });

  return (
    <>
      <PageHeader
        titulo="Componentes"
        descricao="Quem canta e toca no ministério. Inative quem não entra na escala; o cadastro continua salvo."
        acao={
          <div className="flex flex-wrap items-center gap-2">
            {admin && cantores.length > 0 ? (
              <ImprimirComponentes
                admin
                componentes={cantores.map((cantor) => ({
                  nome: cantor.nome,
                  funcoes: cantor.funcoes.map((item) => item.funcao.nome),
                  nascimento: cantor.nascimento
                    ? cantor.nascimento.toISOString().slice(0, 10)
                    : null,
                  perfil: cantor.perfil,
                  ativo: cantor.ativo,
                }))}
              />
            ) : null}
            <BotaoLink href="/cantores/novo">Novo componente</BotaoLink>
          </div>
        }
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
