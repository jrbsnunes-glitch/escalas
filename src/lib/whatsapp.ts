import type { EscalaDetalhe } from "./types";
import {
  alocacoesPorSessao,
  cabecalhoEscala,
  papelAlocacao,
  rotuloSessao,
} from "./escala";

export { formatarDataCompleta, formatarDataCurta } from "./escala";

function linhasSessao(
  alocacoes: EscalaDetalhe["blocos"][number]["alocacoes"],
  espacoEntre = false,
) {
  return alocacoes.flatMap((alocacao, indice) => {
    const papel = papelAlocacao(alocacao);
    const nome = alocacao.integrante.nome.trim().toUpperCase();
    const linhas = [`> *${papel}:* \`${nome}\``];
    if (alocacao.musica) {
      linhas.push(`> _${alocacao.musica.titulo}_`);
      if (alocacao.musica.youtubeUrl) {
        linhas.push(alocacao.musica.youtubeUrl);
      }
    }
    if (espacoEntre && indice < alocacoes.length - 1) {
      linhas.push("");
    }
    return linhas;
  });
}

/** Barra curta: no WhatsApp a fonte não é monoespaçada, então cantos ╔╗ quebram. */
export const BARRA_CULTO = "━".repeat(14);

export function linhasPlacaCulto(titulo: string) {
  return [BARRA_CULTO, `*${titulo}*`, BARRA_CULTO];
}

/**
 * Formatação WhatsApp:
 * cada culto fica entre barras horizontais (funciona na fonte do celular)
 * > *Bateria:* `NETO`
 */
export function formatarWhatsApp(escala: EscalaDetalhe) {
  const linhas: string[] = [];
  linhas.push(`*${cabecalhoEscala(escala.titulo, escala.data)}*`);

  escala.blocos
    .slice()
    .sort((a, b) => a.ordem - b.ordem)
    .forEach((bloco) => {
      const { musicos, cantores } = alocacoesPorSessao(bloco.alocacoes);
      linhas.push("");
      linhas.push(...linhasPlacaCulto(bloco.nome.toUpperCase()));
      if (bloco.direcao.trim()) {
        linhas.push("");
        linhas.push(`> *Direção:* \`${bloco.direcao.trim().toUpperCase()}\``);
      }

      if (musicos.length) {
        linhas.push("");
        linhas.push(`*${rotuloSessao("MUSICO")}*`);
        linhas.push("");
        linhas.push(...linhasSessao(musicos));
      }

      if (cantores.length) {
        linhas.push("");
        linhas.push(`*${rotuloSessao("CANTOR")}*`);
        linhas.push("");
        linhas.push(...linhasSessao(cantores, true));
      }
    });

  return linhas.join("\n");
}
