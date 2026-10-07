import Link from "next/link";
import { ArrowLeftRight, CalendarPlus, Mic2, Sparkles } from "lucide-react";
import { IdentificadorEscala } from "@/components/IdentificadorEscala";
import { BotaoLink, Card, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { cabecalhoEscala } from "@/lib/escala";
import { exigirAdmin } from "@/lib/acesso";
import { contagemComponentesAtivos } from "@/lib/integrante";
import { cookies } from "next/headers";
import { COOKIE_FUSO, dispararLimpezaArquivos } from "@/lib/limpeza-arquivos";

export default async function DashboardPage() {
  await exigirAdmin();
  dispararLimpezaArquivos((await cookies()).get(COOKIE_FUSO)?.value);
  const [integrantesAtivos, escalas, especiais, pendentesTroca] = await Promise.all([
    prisma.integrante.findMany({
      where: { ativo: true },
      select: {
        perfil: true,
        funcoes: { select: { funcao: { select: { nome: true } } } },
      },
    }),
    prisma.escala.findMany({
      where: { especial: false },
      orderBy: { data: "desc" },
      take: 5,
      include: { blocos: true },
    }),
    prisma.escala.findMany({
      where: { especial: true },
      orderBy: { data: "desc" },
      take: 5,
      include: { blocos: true },
    }),
    prisma.pedidoTroca.count({ where: { status: "PENDENTE" } }),
  ]);

  const componentes = contagemComponentesAtivos(integrantesAtivos);

  return (
    <>
      <PageHeader
        titulo="Início"
        descricao="Monte escalas automáticas pelos critérios vocais ou faça a montagem manual do culto."
      />

      {pendentesTroca > 0 && (
        <Link href="/trocas" className="mb-4 block">
          <Card className="border-gold/40">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-gold">Notificação</p>
                <p className="mt-1 font-medium">
                  {pendentesTroca} pedido{pendentesTroca === 1 ? "" : "s"} de troca
                  aguardando aprovação
                </p>
              </div>
              <ArrowLeftRight className="text-gold" size={20} />
            </div>
          </Card>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Componentes ativos</p>
          <p className="mt-2 font-display text-4xl">{componentes.total}</p>
          <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted">Cantores</dt>
              <dd className="font-medium tabular-nums">{componentes.cantores}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted">Músicos</dt>
              <dd className="font-medium tabular-nums">{componentes.musicos}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted">Engenheiros de som</dt>
              <dd className="font-medium tabular-nums">{componentes.engenheirosSom}</dd>
            </div>
          </dl>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Escalas salvas</p>
          <p className="mt-2 font-display text-4xl">
            {await prisma.escala.count({ where: { especial: false } })}
          </p>
        </Card>
        <Card className="sm:col-span-2 lg:col-span-1">
          <p className="text-xs uppercase tracking-wide text-muted">Ações rápidas</p>
          <div className="mt-3 flex flex-col gap-2">
            <BotaoLink href="/escalas/automatica">
              <Sparkles size={16} />
              Gerar com critérios
            </BotaoLink>
            <BotaoLink href="/escalas/manual" variant="ghost">
              <CalendarPlus size={16} />
              Montar manualmente
            </BotaoLink>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl">Últimas escalas</h2>
          <Link href="/escalas" className="text-sm text-gold">
            Ver todas
          </Link>
        </div>
        {escalas.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma escala salva ainda.</p>
        ) : (
          <ul className="divide-y divide-line">
            {escalas.map((escala) => (
              <li key={escala.id} className="py-3">
                <Link
                  href={`/escalas/${escala.id}`}
                  className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {cabecalhoEscala(escala.titulo, escala.data.toISOString())}
                    </p>
                    <p className="text-sm text-muted">
                      {escala.tipo === "AUTO" ? "Automática" : "Manual"} ·{" "}
                      {escala.blocos.length} bloco(s)
                    </p>
                  </div>
                  <span className="text-sm text-gold">Abrir</span>
                </Link>
                <IdentificadorEscala id={escala.id} compacto />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl">Escalas especiais</h2>
          <Link href="/escalas/especiais" className="text-sm text-gold">
            Ver todas
          </Link>
        </div>
        {especiais.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma programação especial ainda.</p>
        ) : (
          <ul className="divide-y divide-line">
            {especiais.map((escala) => (
              <li key={escala.id} className="py-3">
                <Link
                  href={`/escalas/${escala.id}`}
                  className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {cabecalhoEscala(escala.titulo, escala.data.toISOString())}
                    </p>
                    <p className="text-sm text-muted">
                      Especial · {escala.blocos.length} bloco(s)
                    </p>
                  </div>
                  <span className="text-sm text-gold">Abrir</span>
                </Link>
                <IdentificadorEscala id={escala.id} compacto />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="mt-4">
        <BotaoLink href="/cantores/novo" variant="ghost">
          <Mic2 size={16} />
          Cadastrar componente
        </BotaoLink>
      </div>
    </>
  );
}
