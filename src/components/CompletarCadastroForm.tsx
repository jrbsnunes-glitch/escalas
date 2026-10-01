"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Botao, Campo } from "./ui";
import { destinoInicial } from "@/lib/perfis";
import type { PerfilUsuario } from "@/lib/types";

export function CompletarCadastroForm({
  perfil,
  nascimentoInicial = "",
}: {
  perfil: PerfilUsuario;
  nascimentoInicial?: string;
}) {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [nascimento, setNascimento] = useState(nascimentoInicial);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      const resposta = await fetch("/api/auth/completar-cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha, confirmacao, nascimento }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        setErro(dados.erro ?? "Não foi possível concluir.");
        return;
      }
      router.replace(destinoInicial(perfil));
      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-4">
      <Campo label="Nova senha">
        <input
          className="field"
          type="password"
          autoComplete="new-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          minLength={6}
        />
      </Campo>
      <Campo label="Confirmar nova senha">
        <input
          className="field"
          type="password"
          autoComplete="new-password"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          required
          minLength={6}
        />
      </Campo>
      <Campo label="Data de nascimento">
        <input
          className="field"
          type="date"
          value={nascimento}
          onChange={(e) => setNascimento(e.target.value)}
          required
        />
        <p className="mt-1 text-xs text-muted">
          Usada nos avisos de aniversariantes do ministério.
        </p>
      </Campo>
      {erro && <p className="text-sm text-danger">{erro}</p>}
      <Botao type="submit" className="w-full" disabled={enviando}>
        {enviando ? "Salvando..." : "Concluir cadastro"}
      </Botao>
    </form>
  );
}
