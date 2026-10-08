import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { AUTH_COOKIE, assinarSessao, opcoesCookieSessao } from "@/lib/auth";
import { buscarUsuarioPorLogin } from "@/lib/login";
import { precisaCompletarCadastro } from "@/lib/onboarding";
import { destinoAposLogin } from "@/lib/perfis";
import { ehPerfilUsuario } from "@/lib/types";

export async function POST(request: Request) {
  const corpo = await request.json().catch(() => null);
  const usuarioInformado = String(corpo?.usuario ?? corpo?.nome ?? "").trim();
  const senha = String(corpo?.senha ?? "");

  if (!usuarioInformado || !senha) {
    return NextResponse.json(
      { erro: "Informe usuário e senha." },
      { status: 400 },
    );
  }

  const busca = await buscarUsuarioPorLogin(usuarioInformado);
  if ("erro" in busca) {
    const status = busca.erro.includes("mais de uma") ? 409 : 401;
    return NextResponse.json({ erro: busca.erro }, { status });
  }

  const usuario = { ...busca.usuario, integrante: busca.integrante };
  if (
    !usuario.integrante?.ativo ||
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
  const precisa = await precisaCompletarCadastro(usuario.id);
  const destino = precisa ? "/primeiro-acesso" : destinoAposLogin(perfil);
  const opcoes = opcoesCookieSessao();

  const jar = await cookies();
  jar.set(AUTH_COOKIE, token, opcoes);

  const resposta = NextResponse.json({
    usuario: sessao,
    precisaCompletarCadastro: precisa,
    destino,
  });
  resposta.cookies.set(AUTH_COOKIE, token, opcoes);
  return resposta;
}
