import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EscalaAcoes } from "@/components/EscalaAcoes";
import { EscalaCultos } from "@/components/EscalaCultos";
import { WhatsAppPreview } from "@/components/WhatsAppPreview";
import { BotaoLink, Card, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { includeEscala, serializarEscala } from "@/lib/serializers";
import { cabecalhoEscala } from "@/lib/escala";
import { ExcluirEscala } from "@/components/ExcluirEscala";
import { EscalaIdCopiar } from "@/components/EscalaIdCopiar";
import { ehAdmin, exigirSessaoPage, membroPodeVerEscala } from "@/lib/acesso";
import { alocacoesComPedidoPendente, opcoesPedidoTroca } from "@/lib/troca";
import { cookies } from "next/headers";
import { COOKIE_FUSO, dispararLimpezaArquivos } from "@/lib/limpeza-arquivos";

export default async function EscalaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sessao = await exigirSessaoPage();
  dispararLimpezaArquivos((await cookies()).get(COOKIE_FUSO)?.value);
  const { id } = await params;
  const registro = await prisma.escala.findUnique({
    where: { id },
    include: includeEscala,
  });
  if (!registro) notFound();

  if (!ehAdmin(sessao) && !(await membroPodeVerEscala(id))) {
    redirect("/escalas");
  }

  const escala = serializarEscala(registro);
  const admin = ehAdmin(sessao);
  const [opcoes, pendentes] = await Promise.all([
    opcoesPedidoTroca(sessao.integranteId),
    alocacoesComPedidoPendente(sessao.integranteId),
  ]);

  return (
    <>
      <PageHeader
        titulo={cabecalhoEscala(escala.titulo, escala.data)}
        identificador={escala.id}
        acaoIdentificador={<EscalaIdCopiar id={escala.id} />}
        descricao={
          escala.especial
            ? admin
              ? "Escala especial"
              : "Programação especial. Ouça no YouTube ou baixe os arquivos da escala."
            : admin
              ? escala.tipo === "AUTO"
                ? "Gerada com critérios"
                : "Montada manualmente"
              : "Ouça no YouTube ou baixe os arquivos da escala para ensaiar."
        }
        acao={admin ? <EscalaAcoes escala={escala} /> : undefined}
      />

      {admin && escala.avisos.length > 0 && (
        <Card className="mb-4 border-gold/30">
          <p className="mb-2 text-sm font-medium text-gold">Avisos da geração</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            {escala.avisos.map((aviso) => (
              <li key={aviso}>{aviso}</li>
            ))}
          </ul>
        </Card>
      )}

      {admin ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <Card>
            <h2 className="mb-3 font-display text-2xl">Prévia WhatsApp</h2>
            <p className="mb-4 text-sm text-muted">
              O texto copiado usa negrito no cabeçalho, nos cultos, nas sessões e na
              função, barras para separar cada culto, e o nome em maiúsculas entre
              crases para aparecer destacado no WhatsApp.
            </p>
            <WhatsAppPreview escala={escala} />
          </Card>

          <div className="space-y-4">
            <EscalaCultos
              escala={escala}
              mostrarMetadados
              integranteLogadoId={sessao.integranteId}
              pedidosPendentes={pendentes}
              musicas={opcoes.musicas}
              integrantes={opcoes.integrantes}
            />
            <div className="stack-mobile flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Link
                href={`/escalas/${escala.id}/editar`}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-line px-4 text-sm"
              >
                Ajustar nomes
              </Link>
              <BotaoLink href="/escalas" variant="ghost">
                Cancelar
              </BotaoLink>
              <ExcluirEscala id={escala.id} />
            </div>
          </div>
        </div>
      ) : (
        <EscalaCultos
          escala={escala}
          integranteLogadoId={sessao.integranteId}
          pedidosPendentes={pendentes}
          musicas={opcoes.musicas}
          integrantes={opcoes.integrantes}
        />
      )}
    </>
  );
}
