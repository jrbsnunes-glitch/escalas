import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { obterSessao } from "@/lib/auth";
import { ehAdmin } from "@/lib/perfis";
import { prisma } from "@/lib/prisma";
import { COOKIE_FUSO, diasAteAniversario, fusoDeCookie } from "@/lib/datas";
import type { TipoDispositivo } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessao = await obterSessao();
  if (!sessao) redirect("/login");

  const pendentesTroca = ehAdmin(sessao)
    ? await prisma.pedidoTroca.count({ where: { status: "PENDENTE" } })
    : 0;

  const headerList = await headers();
  const cookieStore = await cookies();
  const fuso = fusoDeCookie(cookieStore.get(COOKIE_FUSO)?.value);
  const dispositivo = (headerList.get("x-device-type") ??
    cookieStore.get("device_ua")?.value ??
    "desktop") as TipoDispositivo;

  const comNascimento = await prisma.integrante.findMany({
    where: { ativo: true, nascimento: { not: null } },
    select: { nome: true, nascimento: true },
  });
  const aniversariantesHoje = comNascimento
    .filter(
      (item) =>
        item.nascimento && diasAteAniversario(item.nascimento, new Date(), fuso) === 0,
    )
    .map((item) => item.nome);

  return (
    <AppShell
      sessao={sessao}
      dispositivo={dispositivo}
      pendentesTroca={pendentesTroca}
      aniversariantesHoje={aniversariantesHoje}
    >
      {children}
    </AppShell>
  );
}
