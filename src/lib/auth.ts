import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { AUTH_COOKIE } from "./constants";
import { prisma } from "./prisma";
import { ehPerfilUsuario, type Sessao } from "./types";

export { AUTH_COOKIE };
export type { Sessao };

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) {
    throw new Error("AUTH_SECRET não configurado");
  }
  return new TextEncoder().encode(value);
}

export async function assinarSessao(usuario: Sessao) {
  return new SignJWT({
    email: usuario.email,
    nome: usuario.nome,
    perfil: usuario.perfil,
    integranteId: usuario.integranteId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(usuario.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verificarSessao(token: string): Promise<Sessao | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.sub },
      include: { integrante: true },
    });
    if (
      !usuario?.integrante?.ativo ||
      !ehPerfilUsuario(usuario.perfil)
    ) {
      return null;
    }
    return {
      id: usuario.id,
      integranteId: usuario.integranteId,
      email: usuario.email,
      nome: usuario.integrante.nome,
      perfil: usuario.perfil,
    };
  } catch {
    return null;
  }
}

export async function obterSessao(): Promise<Sessao | null> {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verificarSessao(token);
}

export async function exigirSessao(): Promise<Sessao> {
  const sessao = await obterSessao();
  if (!sessao) {
    throw new Error("Não autenticado");
  }
  return sessao;
}

export function opcoesCookieSessao() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    // O Funnel fala HTTPS com o navegador e HTTP com o Next (127.0.0.1:3000).
    // Cookie Secure nesse caminho é descartado e o login volta para a tela.
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}
