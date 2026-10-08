"use client";

import { useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { BotaoBaixarArquivo } from "./BotaoBaixarArquivo";
import { EXTENSOES_AUDIO, extensaoArquivo } from "@/lib/musica";
import type { ArquivoEscalaResumo } from "@/lib/types";

function formatarTempo(segundos: number) {
  if (!Number.isFinite(segundos) || segundos < 0) return "0:00";
  const total = Math.floor(segundos);
  const min = Math.floor(total / 60);
  const seg = total % 60;
  return `${min}:${String(seg).padStart(2, "0")}`;
}

function pausarOutrosAudios(atual: HTMLAudioElement) {
  document.querySelectorAll("audio").forEach((elemento) => {
    if (elemento !== atual && !elemento.paused) elemento.pause();
  });
}

export function PlayerArquivoEscala({
  arquivo,
  rotulo,
  detalhe,
}: {
  arquivo: ArquivoEscalaResumo;
  rotulo: string;
  detalhe?: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [tocando, setTocando] = useState(false);
  const [atual, setAtual] = useState(0);
  const [duracao, setDuracao] = useState(0);
  const audio = EXTENSOES_AUDIO.has(extensaoArquivo(arquivo.nome));

  async function alternar() {
    const player = audioRef.current;
    if (!player) return;
    if (player.paused) {
      pausarOutrosAudios(player);
      await player.play();
      return;
    }
    player.pause();
  }

  return (
    <div className="rounded-xl border border-line bg-bg-soft px-3 py-2.5">
      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
        <span className="text-sm font-medium text-cream">{rotulo}</span>
        {detalhe ? <span className="text-xs text-muted">{detalhe}</span> : null}
      </div>
      {audio ? (
        <div className="mt-2 flex items-center gap-2">
          <audio
            ref={audioRef}
            preload="metadata"
            src={arquivo.path}
            onPlay={() => setTocando(true)}
            onPause={() => setTocando(false)}
            onEnded={() => setTocando(false)}
            onTimeUpdate={(evento) => setAtual(evento.currentTarget.currentTime)}
            onLoadedMetadata={(evento) =>
              setDuracao(evento.currentTarget.duration)
            }
            onDurationChange={(evento) =>
              setDuracao(evento.currentTarget.duration)
            }
          />
          <button
            type="button"
            onClick={alternar}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-gold text-cream"
            aria-label={tocando ? "Pausar" : "Reproduzir"}
          >
            {tocando ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          </button>
          <input
            type="range"
            min={0}
            max={duracao || 0}
            step={0.1}
            value={Math.min(atual, duracao || 0)}
            aria-label="Posição do áudio"
            className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-line accent-gold"
            onChange={(evento) => {
              const tempo = Number(evento.target.value);
              const player = audioRef.current;
              if (player) player.currentTime = tempo;
              setAtual(tempo);
            }}
          />
          <span className="shrink-0 tabular-nums text-xs text-muted">
            {formatarTempo(atual)} / {formatarTempo(duracao)}
          </span>
        </div>
      ) : null}
      <BotaoBaixarArquivo
        href={arquivo.path}
        nome={arquivo.nome}
        className="mt-2 inline-flex min-h-10 items-center text-sm text-gold disabled:opacity-60"
      >
        Baixar {arquivo.nome}
      </BotaoBaixarArquivo>
    </div>
  );
}
