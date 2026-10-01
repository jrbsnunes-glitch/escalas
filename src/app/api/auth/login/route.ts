import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE, assinarSessao, opcoesCookieSessao } from "@/lib/auth";
import { ehPerfilUsuario } from "@/lib/types";

export async function POST(request: Request) {
  const corpo = await request.json().catch(() => null);
  const email = String(corpo?.email ?? "")
    .trim()
    .toLowerCase();
  const senha = String(corpo?.senha ?? "");

  if (!email || !senha) {
    return NextResponse.json(
      { erro: "Informe e-mail e senha." },
      { status: 400 },
    );
  }

  const usuario = await prisma.usuario.findUnique({
    where: { email },
    include: { integrante: true },
  });
  if (
    !usuario?.integrante?.ativo ||
    !(await bcrypt.compare(senha, usuario.senha))
  ) {
    return NextResponse.json(
      { erro: "Credenciais inválidas." },
      { status: 401 },
    );
  }

  const perfil = ehPerfilUsuario(usuario.perfil) ? usuario.perfil : "MEMBRO";
  const sessao = {
    id: usuario.id,
    integranteId: usuario.integranteId,
    email: usuario.email,
    nome: usuario.integrante.nome,
    perfil,
  };
  const token = await assinarSessao(sessao);

  const resposta = NextResponse.json({ usuario: sessao });
  resposta.cookies.set(AUTH_COOKIE, token, opcoesCookieSessao());
  return resposta;
}
