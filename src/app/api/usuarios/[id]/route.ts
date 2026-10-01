import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { recusarSeNaoAdmin } from "@/lib/acesso";
import { ehPerfilUsuario } from "@/lib/types";
import { includeUsuario, serializarUsuario } from "@/lib/usuario";

async function contarAdmins(excetoId?: string) {
  return prisma.usuario.count({
    where: {
      perfil: "ADMIN",
      ...(excetoId ? { id: { not: excetoId } } : {}),
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { sessao, resposta } = await recusarSeNaoAdmin();
  if (resposta || !sessao) return resposta;

  const { id } = await params;
  const atual = await prisma.usuario.findUnique({
    where: { id },
    include: includeUsuario,
  });
  if (!atual) {
    return NextResponse.json({ erro: "Acesso não encontrado." }, { status: 404 });
  }

  const corpo = await request.json().catch(() => null);
  const senha = corpo?.senha ? String(corpo.senha) : "";
  const perfil = corpo?.perfil ?? atual.perfil;
  if (!ehPerfilUsuario(perfil)) {
    return NextResponse.json({ erro: "Informe o perfil de acesso." }, { status: 400 });
  }
  if (senha && senha.length < 6) {
    return NextResponse.json(
      { erro: "A senha precisa ter ao menos 6 caracteres." },
      { status: 400 },
    );
  }

  if (atual.perfil === "ADMIN" && perfil !== "ADMIN") {
    const outrosAdmins = await contarAdmins(id);
    if (outrosAdmins === 0) {
      return NextResponse.json(
        { erro: "Mantenha ao menos um administrador." },
        { status: 400 },
      );
    }
  }

  const usuario = await prisma.usuario.update({
    where: { id },
    data: {
      perfil,
      ...(senha ? { senha: await bcrypt.hash(senha, 10) } : {}),
    },
    include: includeUsuario,
  });

  return NextResponse.json({ usuario: serializarUsuario(usuario) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { sessao, resposta } = await recusarSeNaoAdmin();
  if (resposta || !sessao) return resposta;

  const { id } = await params;
  const atual = await prisma.usuario.findUnique({
    where: { id },
    include: includeUsuario,
  });
  if (!atual) {
    return NextResponse.json({ erro: "Acesso não encontrado." }, { status: 404 });
  }

  if (atual.id === sessao.id) {
    return NextResponse.json(
      { erro: "Você não pode remover o próprio acesso." },
      { status: 400 },
    );
  }

  if (atual.perfil === "ADMIN" && (await contarAdmins(id)) === 0) {
    return NextResponse.json(
      { erro: "Mantenha ao menos um administrador." },
      { status: 400 },
    );
  }

  await prisma.usuario.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
