import { BotaoBaixarArquivo } from "./BotaoBaixarArquivo";
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
        <BotaoBaixarArquivo
          key={arquivo.id || arquivo.path}
          href={arquivo.path}
          nome={arquivo.nome}
          className="text-left text-gold"
        >
          {rotuloArquivoEscala(arquivo, todos)}
        </BotaoBaixarArquivo>
      ))}
    </>
  );
}
