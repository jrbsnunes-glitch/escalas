import { cookies } from "next/headers";
import { Card, Empty, PageHeader } from "@/components/ui";
import { exigirSessaoPage } from "@/lib/acesso";
import {
  COOKIE_FUSO,
  aniversarioNoMes,
  diasAteAniversario,
  formatarDiaMes,
  fusoDeCookie,
  juntarNomes,
  mesAtual,
  nomeMesAtual,
} from "@/lib/datas";
import { prisma } from "@/lib/prisma";

function rotuloPapel(perfil: string) {
  if (perfil === "MUSICO") return "Músico";
  if (perfil === "AMBOS") return "Cantor e músico";
  return "Cantor";
}

function rotuloFaltam(dias: number) {
  if (dias === 1) return "Falta 1 dia";
  return `Faltam ${dias} dias`;
}

export default async function AniversariantesPage() {
  await exigirSessaoPage();
  const fuso = fusoDeCookie((await cookies()).get(COOKIE_FUSO)?.value);
  const mes = mesAtual(new Date(), fuso);
  const integrantes = await prisma.integrante.findMany({
    where: { nascimento: { not: null }, ativo: true },
    orderBy: { nome: "asc" },
  });
  const aniversariantes = integrantes
    .filter((item) => item.nascimento && aniversarioNoMes(item.nascimento, mes))
    .map((pessoa) => ({
      ...pessoa,
      dias: diasAteAniversario(pessoa.nascimento!, new Date(), fuso),
    }))
    .sort((a, b) => a.dias - b.dias || a.nome.localeCompare(b.nome, "pt-BR"));

  const hoje = aniversariantes.filter((pessoa) => pessoa.dias === 0);
  const nomeMes = nomeMesAtual(new Date(), fuso);

  return (
    <>
      <PageHeader
        titulo="Aniversariantes do mês"
        descricao={`Quem faz aniversário em ${nomeMes}.`}
      />
      {hoje.length > 0 && (
        <Card className="mb-4 border-gold/50 bg-gold/10">
          <p className="text-xs uppercase tracking-wide text-gold">Hoje</p>
          <p className="mt-2 font-display text-2xl text-cream">
            Parabéns, {juntarNomes(hoje.map((pessoa) => pessoa.nome))}!
          </p>
          <p className="mt-1 text-sm text-muted">
            {hoje.length === 1
              ? "Hoje é o aniversário. Que Deus abençoe o novo ano de vida."
              : "Hoje é o aniversário de vocês. Que Deus abençoe o novo ano de vida."}
          </p>
        </Card>
      )}
      {aniversariantes.length === 0 ? (
        <Empty
          titulo="Nenhum aniversariante neste mês"
          descricao="Quando a data de nascimento estiver no cadastro, o nome aparece aqui."
        />
      ) : (
        <div className="grid gap-3">
          {aniversariantes.map((pessoa) => {
            const hojeAniver = pessoa.dias === 0;
            const perto = pessoa.dias > 0 && pessoa.dias <= 5;
            return (
              <Card
                key={pessoa.id}
                className={
                  hojeAniver
                    ? "border-gold/60 bg-gold/15"
                    : perto
                      ? "border-gold/40 bg-gold/10"
                      : ""
                }
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-xl">{pessoa.nome}</p>
                    <p className="text-sm text-muted">{rotuloPapel(pessoa.perfil)}</p>
                    {hojeAniver && (
                      <p className="mt-1 text-sm text-gold">É hoje! Parabéns.</p>
                    )}
                    {perto && (
                      <p className="mt-1 text-sm text-gold">{rotuloFaltam(pessoa.dias)}</p>
                    )}
                  </div>
                  <p className="text-gold">{formatarDiaMes(pessoa.nascimento!)}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
