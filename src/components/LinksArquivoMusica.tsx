import { rotuloArquivoEscala } from "@/lib/arquivo-escala-ui";
import type { ArquivoEscalaResumo } from "@/lib/types";

export function LinksArquivoMusica({
  arquivos,
  todos,
}: {
  arquivos: ArquivoEscalaResumo[];
  todos: ArquivoEscalaResumo[];
}) {
  if (!arquivos.length) return null;
  return (
    <>
      {arquivos.map((arquivo) => (
        <a
          key={arquivo.id || arquivo.path}
          href={arquivo.path}
          download={arquivo.nome}
          className="text-gold"
        >
          {rotuloArquivoEscala(arquivo, todos)}
        </a>
      ))}
    </>
  );
}
