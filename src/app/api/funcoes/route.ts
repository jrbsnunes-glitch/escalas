import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recusarSeNaoAdmin } from "@/lib/acesso";

export async function GET() {
  const { resposta } = await recusarSeNaoAdmin();
  if (resposta) return resposta;

  const funcoes = await prisma.funcao.findMany({
    orderBy: { ordem: "asc" },
  });
  return NextResponse.json({ funcoes });
}

export async function POST(request: Request) {
  const { resposta } = await recusarSeNaoAdmin();
  if (resposta) return resposta;

  const corpo = await request.json();
  const nome = String(corpo.nome ?? "").trim();
  if (!nome) {
    return NextResponse.json({ erro: "Informe o nome da função." }, { status: 400 });
  }

  const ultima = await prisma.funcao.aggregate({ _max: { ordem: true } });
  const funcao = await prisma.funcao.create({
    data: {
      nome,
      grupo: corpo.grupo === "CANTOR" ? "CANTOR" : "MUSICO",
      ordem: Number(corpo.ordem ?? (ultima._max.ordem ?? 0) + 1),
    },
  });
  return NextResponse.json({ funcao }, { status: 201 });
}
