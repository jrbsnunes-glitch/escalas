import Link from "next/link";
import { BotaoLink, Card, Empty, PageHeader } from "@/components/ui";
import { EscalaCultos } from "@/components/EscalaCultos";
import { ehAdmin, exigirSessaoPage } from "@/lib/acesso";
import { cabecalhoEscala } from "@/lib/escala";
import { prisma } from "@/lib/prisma";
import { includeEscala, serializarEscala } from "@/lib/serializers";
import { alocacoesComPedidoPendente, opcoesPedidoTroca } from "@/lib/troca";

export default async function EscalasEspeciaisPage() {
  const sessao = await exigirSessaoPage();
  const admin = ehAdmin(sessao);

  if (!admin) {
    const registros = await prisma.escala.findMany({
      where: { especial: true },
      include: includeEscala,
      orderBy: { data: "desc" },
    });
    const [opcoes, pendentes] = await Promise.all([
      opcoesPedidoTroca(sessao.integranteId),
      alocacoesComPedidoPendente(sessao.integranteId),
    ]);

    return (
      <>
        <PageHeader
          titulo="Escalas especiais"
          descricao="Programações especiais e as músicas de cada culto."
        />
        {registros.length === 0 ? (
          <Empty
            titulo="Nenhuma programação especial"
            descricao="Quando uma escala especial for publicada, ela aparece aqui."
          />
        ) : (
          <div className="space-y-8">
            {registros.map((registro) => {
              const escala = serializarEscala(registro);
              return (
                <div key={escala.id} className="space-y-4">
                  <h2 className="font-display text-2xl">
                    {cabecalhoEscala(escala.titulo, escala.data)}
                  </h2>
                  <EscalaCultos
                    escala={escala}
                    integranteLogadoId={sessao.integranteId}
                    pedidosPendentes={pendentes}
                    musicas={opcoes.musicas}
                    integrantes={opcoes.integrantes}
                  />
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  }

  const escalas = await prisma.escala.findMany({
    where: { especial: true },
    include: { blocos: { include: { alocacoes: true } } },
    orderBy: { data: "desc" },
  });

  return (
    <>
      <PageHeader
        titulo="Escalas especiais"
        descricao="Programe eventos e cultos especiais, separados da escala semanal."
        acao={
          <div className="flex flex-col gap-2 sm:flex-row">
            <BotaoLink href="/escalas/manual?especial=1">
              Nova escala especial
            </BotaoLink>
            <BotaoLink href="/escalas" variant="ghost">
              Escalas da semana
            </BotaoLink>
          </div>
        }
      />

      {escalas.length === 0 ? (
        <Empty
          titulo="Nenhuma escala especial ainda"
          descricao="Monte a programação especial com músicos, cantores e repertório."
        />
      ) : (
        <div className="grid gap-3">
          {escalas.map((escala) => (
            <Link key={escala.id} href={`/escalas/${escala.id}`}>
              <Card>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-display text-xl">
                      {cabecalhoEscala(escala.titulo, escala.data.toISOString())}
                    </p>
                    <p className="text-sm text-muted">
                      Especial · {escala.tipo === "AUTO" ? "Automática" : "Manual"} ·{" "}
                      {escala.blocos.length} culto(s)/bloco(s) ·{" "}
                      {escala.blocos.reduce((acc, b) => acc + b.alocacoes.length, 0)}{" "}
                      nomes
                    </p>
                  </div>
                  <span className="text-sm text-gold">Ver e copiar</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
