"use client";

import { Printer } from "lucide-react";
import { Botao } from "./ui";
import {
  gerarPdfComponentes,
  type ComponenteImpressao,
} from "@/lib/pdf-componentes";

export function ImprimirComponentes({
  componentes,
  admin,
}: {
  componentes: ComponenteImpressao[];
  admin: boolean;
}) {
  if (!admin) return null;

  return (
    <Botao
      type="button"
      variant="ghost"
      onClick={() => gerarPdfComponentes(componentes, { abrirImpressao: true })}
    >
      <Printer size={16} />
      Impressão
    </Botao>
  );
}
