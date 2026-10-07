"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function EscalaIdRotulo({ id }: { id: string }) {
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
    <p className="-mt-3 mb-5 flex flex-wrap items-center gap-2 text-xs text-muted">
      <span>ID da escala</span>
      <code className="max-w-full truncate rounded-lg border border-line bg-bg-soft px-2 py-0.5 font-mono text-[11px] text-cream">
        {id}
      </code>
      <button
        type="button"
        onClick={copiar}
        className="inline-flex items-center gap-1 text-gold hover:underline"
      >
        {copiado ? <Check size={14} /> : <Copy size={14} />}
        {copiado ? "Copiado" : "Copiar"}
      </button>
    </p>
  );
}
