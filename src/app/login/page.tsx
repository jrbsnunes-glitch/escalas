"use client";



import { FormEvent, useState, Suspense } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { Botao, Campo } from "@/components/ui";

import { Logo } from "@/components/Logo";

import { InstalarApp } from "@/components/InstalarApp";

import { destinoAposLogin } from "@/lib/perfis";

import { ehPerfilUsuario } from "@/lib/types";



function LoginForm() {

  const router = useRouter();

  const params = useSearchParams();

  const [usuario, setUsuario] = useState("");

  const [senha, setSenha] = useState("");

  const [erro, setErro] = useState("");

  const [enviando, setEnviando] = useState(false);



  async function entrar(evento: FormEvent) {

    evento.preventDefault();

    setErro("");

    setEnviando(true);

    try {

      const resposta = await fetch("/api/auth/login", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ usuario, senha }),

      });

      const dados = await resposta.json();

      if (!resposta.ok) {

        setErro(dados.erro ?? "Não foi possível entrar.");

        return;

      }

      const perfil = ehPerfilUsuario(dados.usuario?.perfil)

        ? dados.usuario.perfil

        : "MEMBRO";

      if (dados.precisaCompletarCadastro) {
        router.replace("/primeiro-acesso");
      } else {
        router.replace(destinoAposLogin(perfil, params.get("next")));
      }

      router.refresh();

    } finally {

      setEnviando(false);

    }

  }



  return (

    <form onSubmit={entrar} className="space-y-4">

      <Campo label="Usuário">

        <input

          className="field"

          type="text"

          autoComplete="username"

          placeholder="Seu nome no ministério"

          value={usuario}

          onChange={(e) => setUsuario(e.target.value)}

          required

        />

      </Campo>

      <Campo label="Senha">

        <input

          className="field"

          type="password"

          autoComplete="current-password"

          value={senha}

          onChange={(e) => setSenha(e.target.value)}

          required

        />

      </Campo>

      {erro && <p className="text-sm text-danger">{erro}</p>}

      <Botao type="submit" className="w-full" disabled={enviando}>

        {enviando ? "Entrando..." : "Entrar"}

      </Botao>

    </form>

  );

}



export default function LoginPage() {

  return (

    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">

      <section className="relative hidden overflow-hidden bg-[linear-gradient(160deg,#e4efe6,#f3efe4_55%,#ebe4d4)] p-12 lg:flex lg:flex-col lg:justify-between">

        <div className="flex items-center gap-3">

          <Logo size={52} />

          <span className="font-display text-2xl text-cream">Escalas</span>

        </div>

        <div className="max-w-md">

          <p className="font-display text-5xl leading-tight text-cream">

            Escalas do conjunto, no pulso da casa.

          </p>

          <p className="mt-4 text-muted">

            O administrador cadastra os integrantes e libera o acesso com nome e senha.

            Depois copie no formato do WhatsApp ou gere o PDF.

          </p>

        </div>

        <p className="text-xs text-muted">

          Acesso pelo nome cadastrado no ministério e pela senha definida pelo admin.

        </p>

      </section>



      <section className="flex items-center justify-center px-4 py-10">

        <div className="w-full max-w-md rounded-3xl border border-line bg-bg-elev p-6 shadow-[0_16px_48px_rgba(80,70,40,0.12)] sm:p-8">

          <div className="mb-6 flex items-center justify-between gap-3 lg:hidden">

            <div className="flex items-center gap-3">

              <Logo size={44} />

              <div>

                <p className="font-display text-xl">Escalas</p>

                <p className="text-xs text-muted">Conjunto ministerial</p>

              </div>

            </div>

            <InstalarApp />

          </div>

          <h1 className="font-display text-3xl">Entrar</h1>

          <p className="mt-1 mb-6 text-sm text-muted">

            Use o nome do integrante e a senha liberada pelo administrador.

          </p>

          <Suspense fallback={<p className="text-sm text-muted">Carregando...</p>}>

            <LoginForm />

          </Suspense>

        </div>

      </section>

    </div>

  );

}


