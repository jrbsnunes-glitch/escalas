import { Card, Empty, PageHeader } from "@/components/ui";
import { exigirAdmin } from "@/lib/acesso";
import { formatarDiaAcesso, formatarQuandoAcesso } from "@/lib/log-acesso";
import { rotuloPerfil } from "@/lib/perfis";
import { prisma } from "@/lib/prisma";
import { ehPerfilUsuario } from "@/lib/types";

export const dynamic = "force-dynamic";

function chaveDia(data: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(data);
}

export default async function AcessosPage() {
  await exigirAdmin();
  const desde = new Date();
  desde.setUTCDate(desde.getUTCDate() - 90);

  const logs = await prisma.logAcesso.findMany({
    where: { criadoEm: { gte: desde } },
    orderBy: { criadoEm: "desc" },
    take: 400,
  });

  const unicosHoje = new Set(
    logs
      .filter((item) => chaveDia(item.criadoEm) === chaveDia(new Date()))
      .map((item) => item.usuarioId ?? item.nome),
  );

  const grupos = new Map<string, typeof logs>();
  for (const item of logs) {
    const dia = chaveDia(item.criadoEm);
    const lista = grupos.get(dia) ?? [];
    lista.push(item);
    grupos.set(dia, lista);
  }

  return (
    <>
      <PageHeader
        titulo="Acessos"
        descricao="Quem entrou no sistema. O login sempre entra no log; quem já está conectado aparece no máximo uma vez por dia."
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Hoje</p>
          <p className="mt-2 font-display text-3xl">{unicosHoje.size}</p>
          <p className="mt-1 text-sm text-muted">
            {unicosHoje.size === 1 ? "pessoa acessou" : "pessoas acessaram"}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Registros</p>
          <p className="mt-2 font-display text-3xl">{logs.length}</p>
          <p className="mt-1 text-sm text-muted">últimos 90 dias</p>
        </Card>
      </div>

      {logs.length === 0 ? (
        <Empty
          titulo="Nenhum acesso ainda"
          descricao="Os nomes aparecem aqui depois do primeiro login."
        />
      ) : (
        <div className="space-y-4">
          {[...grupos.entries()].map(([dia, itens]) => (
            <Card key={dia}>
              <p className="text-xs font-medium uppercase tracking-wide text-gold">
                {formatarDiaAcesso(itens[0].criadoEm)}
              </p>
              <ul className="mt-3 divide-y divide-line">
                {itens.map((item) => {
                  const perfil = ehPerfilUsuario(item.perfil)
                    ? rotuloPerfil(item.perfil)
                    : item.perfil;
                  return (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 py-2.5 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.nome}</p>
                        <p className="text-xs text-muted">{perfil}</p>
                      </div>
                      <p className="shrink-0 tabular-nums text-muted">
                        {formatarQuandoAcesso(item.criadoEm)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
