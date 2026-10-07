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
      className="inline-flex shrink-0 items-center gap-1 self-start rounded-lg border border-[#1a2420]/25 bg-[#fffdf8] px-3 py-1.5 text-xs font-semibold text-[#1a2420] hover:bg-white"
    >
      {copiado ? <Check size={14} /> : <Copy size={14} />}
      {copiado ? "Copiado" : "Copiar ID"}
    </button>
  );
}
