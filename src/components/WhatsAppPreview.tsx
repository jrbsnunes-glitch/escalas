import {
  alocacoesPorSessao,
  cabecalhoEscala,
  papelAlocacao,
  rotuloSessao,
} from "@/lib/escala";
import { BARRA_CULTO } from "@/lib/whatsapp";
import type { AlocacaoResumo, EscalaDetalhe } from "@/lib/types";

function Linhas({
  alocacoes,
  espacado = false,
}: {
  alocacoes: AlocacaoResumo[];
  espacado?: boolean;
}) {
  return (
    <div>
      {alocacoes.map((alocacao) => (
        <div key={alocacao.id} className={espacado ? "mb-4 last:mb-0" : "mb-1 last:mb-0"}>
          <p>
            {"> "}
            <span className="font-bold">{papelAlocacao(alocacao)}:</span>{" "}
            <span className="wa-code">{alocacao.integrante.nome.toUpperCase()}</span>
          </p>
          {alocacao.musica && (
            <>
              <p className="italic">
                {"> "}
                {alocacao.musica.titulo}
              </p>
              {alocacao.musica.youtubeUrl && <p>{alocacao.musica.youtubeUrl}</p>}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export function WhatsAppPreview({ escala }: { escala: EscalaDetalhe }) {
  return (
    <div className="wa-preview rounded-3xl p-4 sm:p-6">
      <div className="mx-auto max-w-sm">
        <div className="wa-bubble whitespace-pre-wrap px-3 py-3 text-[15px] leading-6">
          <p className="font-bold">{cabecalhoEscala(escala.titulo, escala.data)}</p>
          {escala.blocos
            .slice()
            .sort((a, b) => a.ordem - b.ordem)
            .map((bloco) => {
              const { musicos, cantores } = alocacoesPorSessao(bloco.alocacoes);
              return (
                <div key={bloco.id} className="mt-5">
                  <div className="mb-3 text-center leading-5">
                    <p>{BARRA_CULTO}</p>
                    <p className="font-bold">{bloco.nome.toUpperCase()}</p>
                    <p>{BARRA_CULTO}</p>
                  </div>
                  {bloco.direcao.trim() ? (
                    <p className="mb-2">
                      {"> "}
                      <span className="font-bold">Direção:</span>{" "}
                      <span className="wa-code">{bloco.direcao.trim().toUpperCase()}</span>
                    </p>
                  ) : null}
                  {musicos.length > 0 && (
                    <div>
                      <p className="mt-3 font-bold">{rotuloSessao("MUSICO")}</p>
                      <div className="mt-3">
                        <Linhas alocacoes={musicos} />
                      </div>
                    </div>
                  )}
                  {cantores.length > 0 && (
                    <div>
                      <p className="mt-4 font-bold">{rotuloSessao("CANTOR")}</p>
                      <div className="mt-3">
                        <Linhas alocacoes={cantores} espacado />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
