import Link from "next/link";
import { BotaoLink, Card, Empty, PageHeader } from "@/components/ui";
import { ehAdmin, exigirSessaoPage } from "@/lib/acesso";
import { cabecalhoEscala, musicasPorBloco } from "@/lib/escala";
import { prisma } from "@/lib/prisma";
import { includeEscala, serializarEscala } from "@/lib/serializers";

export default async function RepertorioEspeciaisPage() {
  const sessao = await exigirSessaoPage();
  const admin = ehAdmin(sessao);
  const registros = await prisma.escala.findMany({
    where: { especial: true },
    include: includeEscala,
    orderBy: { data: "desc" },
  });
  const escalas = registros.map(serializarEscala);

  return (
    <>
      <PageHeader
        titulo="Repertório Especiais"
        descricao="Músicas do repertório usadas em cada escala especial."
        acao={
          <BotaoLink href="/repertorio" variant="ghost">
            Voltar ao repertório
          </BotaoLink>
        }
      />
      {escalas.length === 0 ? (
        <Empty
          titulo="Nenhuma escala especial ainda"
          descricao={
            admin
              ? "Monte uma escala especial em Escalas para o repertório aparecer aqui."
              : "Quando houver programação especial, as músicas aparecem aqui."
          }
        />
      ) : (
        <div className="grid gap-4">
          {escalas.map((escala) => {
            const blocos = musicasPorBloco(escala);
            const temMusica = blocos.some((bloco) => bloco.musicas.length > 0);
            return (
              <Card key={escala.id}>
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-display text-2xl">
                      {cabecalhoEscala(escala.titulo, escala.data)}
                    </h2>
                    <p className="text-sm text-muted">Escala especial</p>
                  </div>
                  <Link href={`/escalas/${escala.id}`} className="text-sm text-gold">
                    Abrir escala
                  </Link>
                </div>
                {!temMusica ? (
                  <p className="text-sm text-muted">
                    Nenhuma música do repertório foi vinculada nesta escala.
                  </p>
                ) : (
                  <div className="grid gap-4">
                    {blocos.map((bloco) =>
                      bloco.musicas.length === 0 ? null : (
                        <div key={bloco.id}>
                          <p className="text-xs font-medium uppercase tracking-wide text-gold">
                            {bloco.nome}
                          </p>
                          <ul className="mt-2 divide-y divide-line">
                            {bloco.musicas.map((musica) => (
                              <li
                                key={musica.id}
                                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <p className="font-medium">{musica.titulo}</p>
                                <div className="flex flex-wrap gap-2">
                                  {musica.youtubeUrl && (
                                    <a
                                      href={musica.youtubeUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-line px-4 text-sm hover:bg-bg-soft"
                                    >
                                      YouTube
                                    </a>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
