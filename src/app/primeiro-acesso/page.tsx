import { redirect } from "next/navigation";
import { CompletarCadastroForm } from "@/components/CompletarCadastroForm";
import { Logo } from "@/components/Logo";
import { obterSessao } from "@/lib/auth";
import { ymdDeData } from "@/lib/datas";
import { precisaCompletarCadastro } from "@/lib/onboarding";
import { ehPerfilUsuario } from "@/lib/types";
import { prisma } from "@/lib/prisma";

export default async function PrimeiroAcessoPage() {
  const sessao = await obterSessao();
  if (!sessao) redirect("/login");

  if (!(await precisaCompletarCadastro(sessao.id))) {
    redirect(sessao.perfil === "ADMIN" ? "/dashboard" : "/escalas");
  }

  const integrante = await prisma.integrante.findUnique({
    where: { id: sessao.integranteId },
    select: { nascimento: true },
  });

  const perfil = ehPerfilUsuario(sessao.perfil) ? sessao.perfil : "MEMBRO";

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-line bg-bg-elev p-6 shadow-[0_16px_48px_rgba(80,70,40,0.12)] sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <Logo size={44} />
          <div>
            <p className="font-display text-xl">Olá, {sessao.nome}</p>
            <p className="text-xs text-muted">Primeiro acesso</p>
          </div>
        </div>
        <h1 className="font-display text-2xl">Complete seu cadastro</h1>
        <p className="mt-1 mb-6 text-sm text-muted">
          Defina sua senha pessoal e informe sua data de nascimento para os avisos de
          aniversário.
        </p>
        <CompletarCadastroForm
          perfil={perfil}
          nascimentoInicial={ymdDeData(integrante?.nascimento)}
        />
      </div>
    </div>
  );
}
