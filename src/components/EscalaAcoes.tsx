"use client";

import { useState } from "react";
import { Check, Copy, FileDown } from "lucide-react";
import { Botao } from "./ui";
import { formatarWhatsApp } from "@/lib/whatsapp";
import { gerarPdfEscala } from "@/lib/pdf";
import type { EscalaDetalhe } from "@/lib/types";

export function EscalaAcoes({ escala }: { escala: EscalaDetalhe }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    const texto = formatarWhatsApp(escala);
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      const area = document.createElement("textarea");
      area.value = texto;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      document.body.removeChild(area);
    }
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="stack-mobile flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
      <Botao type="button" onClick={copiar}>
        {copiado ? <Check size={16} /> : <Copy size={16} />}
        {copiado ? "Copiado" : "Copiar para WhatsApp"}
      </Botao>
      <Botao type="button" variant="ghost" onClick={() => gerarPdfEscala(escala)}>
        <FileDown size={16} />
        Gerar PDF
      </Botao>
    </div>
  );
}
