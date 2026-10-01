"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Botao, BotaoLink } from "./ui";

export function CantorAcoes({
  id,
  nome,
  ativo,
}: {
  id: string;
  nome: string;
  ativo: boolean;
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);

  async function inativar() {
    setEnviando(true);
    try {
      await fetch(`/api/cantores/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: false }),
      });
      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  async function excluir() {
    if (
      !window.confirm(
        `Excluir o cadastro de ${nome}? Essa ação não pode ser desfeita. O nome também sai das escalas em que estiver.`,
      )
    ) {
      return;
    }
    setEnviando(true);
    try {
      await fetch(`/api/cantores/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <BotaoLink href={`/cantores/${id}`} variant="ghost">
        Editar
      </BotaoLink>
      {ativo && (
        <Botao
          type="button"
          variant="ghost"
          className="min-h-9 px-3 text-xs"
          disabled={enviando}
          onClick={inativar}
        >
          Inativar
        </Botao>
      )}
      <Botao
        type="button"
        variant="ghost"
        className="min-h-9 px-3 text-xs text-danger hover:bg-danger/10"
        disabled={enviando}
        onClick={excluir}
      >
        Excluir
      </Botao>
    </div>
  );
}
