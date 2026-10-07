import Link from "next/link";
import { IdentificadorEscala } from "@/components/IdentificadorEscala";
import { BotaoLink, Card, Empty, PageHeader } from "@/components/ui";
import { EscalaCultos } from "@/components/EscalaCultos";
import { prisma } from "@/lib/prisma";
import { cabecalhoEscala } from "@/lib/escala";
import { includeEscala, serializarEscala } from "@/lib/serializers";
import {
  ehAdmin,
  escolherEscalasDaSemana,
  exigirSessaoPage,
  inicioDoDiaSaoPaulo,
} from "@/lib/acesso";
import { alocacoesComPedidoPendente, opcoesPedidoTroca } from "@/lib/troca";
import { cookies } from "next/headers";
import { COOKIE_FUSO, dispararLimpezaArquivos } from "@/lib/limpeza-arquivos";

export const dynamic = "force-dynamic";

export default async function EscalasPage() {
  const sessao = await exigirSessaoPage();
  dispararLimpezaArquivos((await cookies()).get(COOKIE_FUSO)?.value);
  const admin = ehAdmin(sessao);

  if (!admin) {
    const futuras = await prisma.escala.findMany({
      where: { data: { gte: inicioDoDiaSaoPaulo() }, especial: false },
      include: includeEscala,
      orderBy: { data: "asc" },
    });
    const daSemana = escolherEscalasDaSemana(futuras);
    const [opcoes, pendentes] = await Promise.all([
      opcoesPedidoTroca(sessao.integranteId),
      alocacoesComPedidoPendente(sessao.integranteId),
    ]);

    return (
      <>
        <PageHeader
          titulo="Escala da semana"
          descricao="Confira o culto da semana, ouça no YouTube ou baixe os arquivos da escala."
          acao={
            <BotaoLink href="/escalas/especiais" variant="ghost">
              Escalas Especiais
            </BotaoLink>
          }
        />
        {daSemana.length === 0 ? (
          <Empty
            titulo="Nenhum culto pela frente"
            descricao="Quando a próxima escala for publicada, ela aparece aqui."
          />
        ) : (
          <div className="space-y-8">
            {daSemana.map((registro) => {
              const escala = serializarEscala(registro);
              return (
                <div key={escala.id} className="space-y-4">
                  <div>
                    <h2 className="font-display text-2xl">
                      {cabecalhoEscala(escala.titulo, escala.data)}
                    </h2>
                    <IdentificadorEscala id={escala.id} compacto />
                  </div>
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
    where: { especial: false },
    include: { blocos: { include: { alocacoes: true } } },
    orderBy: { data: "desc" },
  });

  return (
    <>
      <PageHeader
        titulo="Escalas prontas"
        descricao="Abra uma escala para copiar no formato do WhatsApp ou gerar o PDF."
        acao={
          <div className="flex flex-col gap-2 sm:flex-row">
            <BotaoLink href="/escalas/especiais" variant="ghost">
              Escalas Especiais
            </BotaoLink>
            <BotaoLink href="/escalas/automatica">Gerar automática</BotaoLink>
            <BotaoLink href="/escalas/manual" variant="ghost">
              Montar manual
            </BotaoLink>
          </div>
        }
      />

      {escalas.length === 0 ? (
        <Empty
          titulo="Nenhuma escala ainda"
          descricao="Gere pelos critérios vocais ou monte o culto manualmente."
        />
      ) : (
        <div className="grid gap-3">
          {escalas.map((escala) => (
            <Card key={escala.id}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <Link href={`/escalas/${escala.id}`} className="block">
                    <p className="font-display text-xl">
                      {cabecalhoEscala(escala.titulo, escala.data.toISOString())}
                    </p>
                    <p className="text-sm text-muted">
                      {escala.tipo === "AUTO" ? "Automática" : "Manual"} ·{" "}
                      {escala.blocos.length} culto(s)/bloco(s) ·{" "}
                      {escala.blocos.reduce((acc, b) => acc + b.alocacoes.length, 0)}{" "}
                      nomes
                    </p>
                  </Link>
                  <IdentificadorEscala id={escala.id} compacto />
                </div>
                <Link href={`/escalas/${escala.id}`} className="text-sm text-gold">
                  Ver e copiar
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
