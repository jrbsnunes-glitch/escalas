import { Card, PageHeader, BotaoLink } from "@/components/ui";
import { RepertorioAdmin } from "@/components/RepertorioAdmin";
import { prisma } from "@/lib/prisma";
import { serializarMusica } from "@/lib/musica";
import { ehAdmin, exigirSessaoPage } from "@/lib/acesso";

export default async function RepertorioPage() {
  const sessao = await exigirSessaoPage();
  const admin = ehAdmin(sessao);
  const musicas = await prisma.musica.findMany({
    where: admin ? undefined : { ativo: true },
    orderBy: admin ? [{ ativo: "desc" }, { titulo: "asc" }] : { titulo: "asc" },
  });

  return (
    <>
      <PageHeader
        titulo="Repertório"
        descricao={
          admin
            ? "Cadastre as músicas com o link do YouTube. Áudio e cifra vão na escala do culto."
            : "Ouça no YouTube. Áudio e cifra ficam na escala do culto."
        }
        acao={
          <BotaoLink href="/repertorio/especiais" variant="ghost">
            Repertório Especiais
          </BotaoLink>
        }
      />
      <Card>
        <RepertorioAdmin
          musicas={musicas.map(serializarMusica)}
          podeEditar={admin}
        />
      </Card>
    </>
  );
}
