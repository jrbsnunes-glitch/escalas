import { redirect } from "next/navigation";
import { obterSessao } from "@/lib/auth";
import { destinoInicial } from "@/lib/perfis";

export default async function HomePage() {
  const sessao = await obterSessao();
  redirect(sessao ? destinoInicial(sessao.perfil) : "/login");
}
