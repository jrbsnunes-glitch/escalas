"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function EscalaIdCopiar({ id }: { id: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(id);
    } catch {
      const area = document.createElement("textarea");
      area.value = id;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      document.body.removeChild(area);
    }
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={(evento) => {
        evento.preventDefault();
        evento.stopPropagation();
        void copiar();
      }}
      className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted hover:text-cream"
      aria-label={copiado ? "ID copiado" : "Copiar ID da escala"}
    >
      {copiado ? <Check size={12} /> : <Copy size={12} />}
      {copiado ? "Copiado" : "Copiar"}
    </button>
  );
}
