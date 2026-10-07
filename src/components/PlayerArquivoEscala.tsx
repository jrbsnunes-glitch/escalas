"use client";

import { EXTENSOES_AUDIO, extensaoArquivo } from "@/lib/musica";
import type { ArquivoEscalaResumo } from "@/lib/types";

export function PlayerArquivoEscala({
  arquivo,
  rotulo,
  detalhe,
}: {
  arquivo: ArquivoEscalaResumo;
  rotulo: string;
  detalhe?: string;
}) {
  const audio = EXTENSOES_AUDIO.has(extensaoArquivo(arquivo.nome));

  return (
    <div className="rounded-xl border border-line bg-bg-soft px-3 py-2.5">
      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
        <span className="text-sm font-medium text-cream">{rotulo}</span>
        {detalhe ? <span className="text-xs text-muted">{detalhe}</span> : null}
      </div>
      {audio ? (
        <audio
          className="mt-2 w-full"
          controls
          preload="metadata"
          src={arquivo.path}
        >
          Seu navegador não reproduz este áudio.
        </audio>
      ) : null}
      <a
        href={arquivo.path}
        download={arquivo.nome}
        className="mt-2 inline-flex min-h-10 items-center text-sm text-gold"
      >
        Baixar {arquivo.nome}
      </a>
    </div>
  );
}
