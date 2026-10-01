import { rotuloArquivoEscala } from "@/lib/arquivo-escala-ui";
import type { ArquivoEscalaResumo } from "@/lib/types";

export function LinksArquivosEscala({
  arquivos,
}: {
  arquivos: ArquivoEscalaResumo[];
}) {
  if (!arquivos.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {arquivos.map((arquivo) => (
        <a
          key={arquivo.id || arquivo.path}
          href={arquivo.path}
          download={arquivo.nome}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-line px-4 text-sm hover:bg-bg-soft"
        >
          {rotuloArquivoEscala(arquivo, arquivos)}
        </a>
      ))}
    </div>
  );
}
