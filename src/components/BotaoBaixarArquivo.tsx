"use client";

import { useState, type ReactNode } from "react";
import { baixarArquivoSemSair } from "@/lib/baixar-arquivo";

export function BotaoBaixarArquivo({
  href,
  nome,
  children,
  className = "",
}: {
  href: string;
  nome: string;
  children: ReactNode;
  className?: string;
}) {
  const [estado, setEstado] = useState<"idle" | "baixando" | "erro">("idle");

  return (
    <button
      type="button"
      className={className}
      disabled={estado === "baixando"}
      onClick={async () => {
        setEstado("baixando");
        try {
          await baixarArquivoSemSair(href, nome);
          setEstado("idle");
        } catch {
          setEstado("erro");
        }
      }}
    >
      {estado === "baixando"
        ? "Baixando…"
        : estado === "erro"
          ? "Tentar de novo"
          : children}
    </button>
  );
}
