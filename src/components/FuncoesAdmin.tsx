"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Botao, Campo } from "./ui";

type Funcao = {
  id: string;
  nome: string;
  grupo: string;
  ordem: number;
  ativo: boolean;
};

export function FuncoesAdmin({ funcoes }: { funcoes: Funcao[] }) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [grupo, setGrupo] = useState("MUSICO");

  async function criar(evento: FormEvent) {
    evento.preventDefault();
    await fetch("/api/funcoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, grupo }),
    });
    setNome("");
    router.refresh();
  }

  async function alternar(funcao: Funcao) {
    await fetch(`/api/funcoes/${funcao.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !funcao.ativo }),
    });
    router.refresh();
  }

  async function excluir(funcao: Funcao) {
    if (
      !window.confirm(
        `Excluir a função "${funcao.nome}"? Essa ação não pode ser desfeita.`,
      )
    ) {
      return;
    }
    await fetch(`/api/funcoes/${funcao.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={criar} className="flex flex-col gap-3 sm:flex-row">
        <Campo label="Nova função">
          <input
            className="field"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Saxofone"
            required
          />
        </Campo>
        <Campo label="Sessão">
          <select className="field" value={grupo} onChange={(e) => setGrupo(e.target.value)}>
            <option value="MUSICO">Músicos</option>
            <option value="CANTOR">Cantores</option>
          </select>
        </Campo>
        <div className="sm:self-end">
          <Botao type="submit">Adicionar</Botao>
        </div>
      </form>
      <ul className="divide-y divide-line">
        {funcoes.map((funcao) => (
          <li key={funcao.id} className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">{funcao.nome}</p>
              <p className="text-xs text-muted">
                {funcao.grupo === "CANTOR" ? "Cantores" : "Músicos"} ·{" "}
                {funcao.ativo ? "Ativa" : "Inativa"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Botao type="button" variant="ghost" onClick={() => alternar(funcao)}>
                {funcao.ativo ? "Inativar" : "Reativar"}
              </Botao>
              <Botao type="button" variant="danger" onClick={() => excluir(funcao)}>
                Excluir
              </Botao>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
