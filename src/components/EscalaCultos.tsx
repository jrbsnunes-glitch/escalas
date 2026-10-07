import { Card } from "./ui";
import {
  arquivosDaMusica,
  rotuloArquivoEscala,
  tituloMusicaNaEscala,
} from "@/lib/arquivo-escala-ui";
import { IdentificadorEscala } from "./IdentificadorEscala";
import { LinksArquivoMusica } from "./LinksArquivoMusica";
import { PlayerArquivoEscala } from "./PlayerArquivoEscala";
import { SolicitarTroca } from "./SolicitarTroca";
import {
  alocacoesPorSessao,
  papelAlocacao,
  rotuloSessao,
  sessaoDaAlocacao,
} from "@/lib/escala";
import type {
  AlocacaoResumo,
  ArquivoEscalaResumo,
  EscalaDetalhe,
  IntegranteResumo,
  MusicaResumo,
} from "@/lib/types";

function ListaSessao({
  titulo,
  alocacoes,
  espacado = false,
  integranteLogadoId,
  pedidosPendentes,
  musicas,
  integrantes,
  arquivosEscala = [],
}: {
  titulo: string;
  alocacoes: AlocacaoResumo[];
  espacado?: boolean;
  integranteLogadoId?: string;
  pedidosPendentes?: string[];
  musicas?: MusicaResumo[];
  integrantes?: IntegranteResumo[];
  arquivosEscala?: ArquivoEscalaResumo[];
}) {
  if (!alocacoes.length) return null;
  return (
    <div className="mt-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gold">{titulo}</p>
      <ul className={`mt-2 text-sm ${espacado ? "space-y-4" : "space-y-2"}`}>
        {alocacoes.map((alocacao) => {
          const propria =
            Boolean(integranteLogadoId) &&
            alocacao.integrante.id === integranteLogadoId;
          return (
            <li
              key={alocacao.id}
              className={`flex flex-col gap-3 rounded-xl px-3 py-2 sm:flex-row sm:items-center sm:justify-between ${
                propria
                  ? "border border-gold bg-gold/10"
                  : "bg-bg-soft"
              }`}
            >
              <span>
                <span className="text-muted">{papelAlocacao(alocacao)}</span>
                <span className="mx-2">·</span>
                <strong>{alocacao.integrante.nome}</strong>
                {alocacao.musica && (
                  <span className="mt-1 block text-xs text-muted">
                    {alocacao.musica.titulo}
                    <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      {alocacao.musica.youtubeUrl && (
                        <a
                          href={alocacao.musica.youtubeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-gold"
                        >
                          Abrir no YouTube
                        </a>
                      )}
                      <LinksArquivoMusica
                        arquivos={arquivosDaMusica(arquivosEscala, alocacao.musica.id)}
                        todos={arquivosEscala}
                      />
                    </span>
                  </span>
                )}
              </span>
              {propria && musicas && integrantes && (
                <SolicitarTroca
                  alocacaoId={alocacao.id}
                  sessao={sessaoDaAlocacao(alocacao)}
                  funcao={alocacao.funcao}
                  pendente={pedidosPendentes?.includes(alocacao.id) ?? false}
                  musicas={musicas}
                  integrantes={integrantes.filter(
                    (pessoa) => pessoa.id !== integranteLogadoId,
                  )}
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function EscalaCultos({
  escala,
  mostrarMetadados = false,
  integranteLogadoId,
  pedidosPendentes = [],
  musicas = [],
  integrantes = [],
}: {
  escala: EscalaDetalhe;
  mostrarMetadados?: boolean;
  integranteLogadoId?: string;
  pedidosPendentes?: string[];
  musicas?: MusicaResumo[];
  integrantes?: IntegranteResumo[];
}) {
  const todosArquivos = escala.arquivos ?? [];

  return (
    <div className="space-y-4">
      <IdentificadorEscala id={escala.id} />
      {todosArquivos.length > 0 && (
        <Card>
          <h3 className="mb-2 font-display text-xl">Áudios e cifras</h3>
          <p className="mb-3 text-sm text-muted">
            Disponíveis até o dia seguinte ao culto. Ouça aqui ou baixe o arquivo.
          </p>
          <ul className="grid gap-2">
            {todosArquivos.map((arquivo) => {
              const musica = tituloMusicaNaEscala(escala, arquivo.musicaId);
              const rotulo = rotuloArquivoEscala(arquivo, todosArquivos);
              const detalhe = [
                musica ?? "Anexo geral",
                arquivo.nome !== rotulo ? arquivo.nome : "",
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <li key={arquivo.id || arquivo.path}>
                  <PlayerArquivoEscala
                    arquivo={arquivo}
                    rotulo={rotulo}
                    detalhe={detalhe}
                  />
                </li>
              );
            })}
          </ul>
        </Card>
      )}
      {escala.blocos.map((bloco) => (
        <Card key={bloco.id}>
          <h3 className="font-display text-xl">{bloco.nome}</h3>
          {bloco.direcao.trim() ? (
            <p className="mt-1 text-sm">
              <span className="text-muted">Direção</span>
              <span className="mx-2">·</span>
              <strong>{bloco.direcao.trim()}</strong>
            </p>
          ) : null}
          {mostrarMetadados && escala.tipo === "AUTO" && (
            <p className="mt-1 text-xs text-muted">
              Afinação média {bloco.mediaAfinacao} · {bloco.tiposVozDistintos} tipos
              de voz · {bloco.temAncora ? "com âncora" : "sem âncora"} ·{" "}
              {bloco.temHomem ? "com homem" : "sem homem"}
            </p>
          )}
          <ListaSessao
            titulo={rotuloSessao("MUSICO")}
            alocacoes={alocacoesPorSessao(bloco.alocacoes).musicos}
            integranteLogadoId={integranteLogadoId}
            pedidosPendentes={pedidosPendentes}
            musicas={musicas}
            integrantes={integrantes}
            arquivosEscala={escala.arquivos ?? []}
          />
          <ListaSessao
            titulo={rotuloSessao("CANTOR")}
            alocacoes={alocacoesPorSessao(bloco.alocacoes).cantores}
            espacado
            integranteLogadoId={integranteLogadoId}
            pedidosPendentes={pedidosPendentes}
            musicas={musicas}
            integrantes={integrantes}
            arquivosEscala={escala.arquivos ?? []}
          />
        </Card>
      ))}
    </div>
  );
}
