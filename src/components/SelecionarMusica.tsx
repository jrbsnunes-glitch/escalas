"use client";

import { useId, useMemo, useRef, useState } from "react";
import type { MusicaResumo } from "@/lib/types";

function normalizarBusca(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function SelecionarMusica({
  musicas,
  value,
  onChange,
}: {
  musicas: MusicaResumo[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const caixa = useRef<HTMLDivElement>(null);
  const listaId = useId();
  const selecionada = musicas.find((musica) => musica.id === value);

  const filtradas = useMemo(() => {
    const termo = normalizarBusca(aberto ? busca : "");
    return musicas.filter(
      (musica) =>
        !termo ||
        normalizarBusca(musica.titulo).includes(termo) ||
        musica.id === value,
    );
  }, [musicas, busca, aberto, value]);

  function escolher(id: string) {
    onChange(id);
    setAberto(false);
    setBusca("");
  }

  return (
    <div ref={caixa} className="relative min-w-0">
      <input
        className="field"
        value={aberto ? busca : (selecionada?.titulo ?? "")}
        placeholder="Pesquisar música"
        autoComplete="off"
        aria-label="Pesquisar música"
        aria-expanded={aberto}
        aria-controls={listaId}
        onFocus={() => {
          setBusca("");
          setAberto(true);
        }}
        onChange={(evento) => {
          setBusca(evento.target.value);
          setAberto(true);
        }}
        onBlur={(evento) => {
          if (caixa.current?.contains(evento.relatedTarget as Node)) return;
          setAberto(false);
          setBusca("");
        }}
        onKeyDown={(evento) => {
          if (evento.key === "Escape") {
            setAberto(false);
            setBusca("");
            evento.currentTarget.blur();
          }
          if (evento.key === "Enter") {
            evento.preventDefault();
            const primeira = filtradas[0];
            if (primeira) escolher(primeira.id);
          }
        }}
      />
      {aberto ? (
        <ul
          id={listaId}
          className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-line bg-bg-elev py-1 shadow-[0_12px_32px_rgba(80,70,40,0.12)]"
        >
          <li>
            <button
              type="button"
              className={`flex w-full px-3 py-2 text-left text-sm ${
                !value ? "bg-gold/10 text-gold" : "text-muted hover:bg-bg-soft"
              }`}
              onMouseDown={(evento) => evento.preventDefault()}
              onClick={() => escolher("")}
            >
              Sem música
            </button>
          </li>
          {filtradas.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted">
              Nenhuma música encontrada.
            </li>
          ) : (
            filtradas.map((musica) => (
              <li key={musica.id}>
                <button
                  type="button"
                  className={`flex w-full px-3 py-2 text-left text-sm ${
                    musica.id === value
                      ? "bg-gold/10 font-medium text-gold"
                      : "hover:bg-bg-soft"
                  }`}
                  onMouseDown={(evento) => evento.preventDefault()}
                  onClick={() => escolher(musica.id)}
                >
                  {musica.titulo}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
