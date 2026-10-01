import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/constants";

export async function POST() {
  const resposta = NextResponse.json({ ok: true });
  resposta.cookies.set(AUTH_COOKIE, "", { path: "/", maxAge: 0 });
  return resposta;
}
