import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { obterSessao } from "@/lib/auth";
import { parseDataIso } from "@/lib/datas";
import { prisma } from "@/lib/prisma";
import { precisaCompletarCadastro } from "@/lib/onboarding";

export async function POST(request: Request) {
  const sessao = await obterSessao();
  if (!sessao) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  if (!(await precisaCompletarCadastro(sessao.id))) {
    return NextResponse.json({ erro: "Cadastro já foi concluído." }, { status: 400 });
  }

  const corpo = await request.json().catch(() => null);
  const senha = String(corpo?.senha ?? "");
  const confirmacao = String(corpo?.confirmacao ?? "");
  const nascimento = parseDataIso(corpo?.nascimento);

  if (!senha || senha.length < 6) {
    return NextResponse.json(
      { erro: "A nova senha precisa ter ao menos 6 caracteres." },
      { status: 400 },
    );
  }
  if (senha !== confirmacao) {
    return NextResponse.json({ erro: "As senhas não conferem." }, { status: 400 });
  }
  if (!nascimento) {
    return NextResponse.json(
      { erro: "Informe a data de nascimento (dia, mês e ano)." },
      { status: 400 },
    );
  }

  await prisma.$transaction([
    prisma.usuario.update({
      where: { id: sessao.id },
      data: {
        senha: await bcrypt.hash(senha, 10),
        primeiroAcesso: false,
      },
    }),
    prisma.integrante.update({
      where: { id: sessao.integranteId },
      data: { nascimento },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
