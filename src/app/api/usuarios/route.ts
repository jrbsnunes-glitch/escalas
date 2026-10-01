import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { recusarSeNaoAdmin } from "@/lib/acesso";
import { ehPerfilUsuario } from "@/lib/types";
import { emailInterno } from "@/lib/login";
import { includeUsuario, serializarUsuario } from "@/lib/usuario";

export async function GET() {
  const { resposta } = await recusarSeNaoAdmin();
  if (resposta) return resposta;

  const usuarios = await prisma.usuario.findMany({
    include: includeUsuario,
    orderBy: [{ perfil: "asc" }, { integrante: { nome: "asc" } }],
  });

  return NextResponse.json({
    usuarios: usuarios.map(serializarUsuario),
  });
}

export async function POST(request: Request) {
  const { resposta } = await recusarSeNaoAdmin();
  if (resposta) return resposta;

  const corpo = await request.json().catch(() => null);
  const integranteId = String(corpo?.integranteId ?? "").trim();
  const senha = String(corpo?.senha ?? "");
  const perfil = corpo?.perfil;

  if (!integranteId || !senha) {
    return NextResponse.json(
      { erro: "Escolha o integrante e defina a senha de acesso." },
      { status: 400 },
    );
  }
  if (!ehPerfilUsuario(perfil)) {
    return NextResponse.json({ erro: "Informe o perfil de acesso." }, { status: 400 });
  }
  if (senha.length < 6) {
    return NextResponse.json(
      { erro: "A senha precisa ter ao menos 6 caracteres." },
      { status: 400 },
    );
  }

  const integrante = await prisma.integrante.findUnique({
    where: { id: integranteId },
    include: { usuario: true },
  });
  if (!integrante) {
    return NextResponse.json(
      { erro: "Cantor ou músico não encontrado." },
      { status: 404 },
    );
  }
  if (integrante.usuario) {
    return NextResponse.json(
      { erro: "Essa pessoa já tem acesso ao sistema." },
      { status: 409 },
    );
  }

  const usuario = await prisma.usuario.create({
    data: {
      integranteId,
      email: emailInterno(integranteId),
      senha: await bcrypt.hash(senha, 10),
      perfil,
      primeiroAcesso: true,
    },
    include: includeUsuario,
  });

  return NextResponse.json(
    { usuario: serializarUsuario(usuario) },
    { status: 201 },
  );
}
