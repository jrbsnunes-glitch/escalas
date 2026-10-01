"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Botao, BotaoLink, Campo } from "./ui";
import { arquivosDaMusica } from "@/lib/arquivo-escala-ui";
import { cabecalhoEscala, rotuloSessao } from "@/lib/escala";
import type {
  ArquivoEscalaResumo,
  IntegranteResumo,
  MusicaResumo,
  SessaoEscala,
} from "@/lib/types";

type Funcao = { id: string; nome: string; grupo: string };

type Linha = {
  integranteId: string;
  funcaoId: string;
  sessao: SessaoEscala;
  musicaId?: string;
};
type Bloco = { nome: string; direcao: string; alocacoes: Linha[] };

function primeiraFuncao(funcoes: Funcao[], sessao: SessaoEscala) {
  return (
    funcoes.find((item) => item.grupo === sessao)?.id ??
    funcoes[0]?.id ??
    ""
  );
}

export function EscalaManualForm({
  integrantes,
  funcoes,
  musicas = [],
  inicial,
  escalaId,
  especialInicial = false,
}: {
  integrantes: IntegranteResumo[];
  funcoes: Funcao[];
  musicas?: MusicaResumo[];
  inicial?: {
    titulo: string;
    data: string;
    blocos: Bloco[];
    especial?: boolean;
    arquivos?: ArquivoEscalaResumo[];
  };
  escalaId?: string;
  especialInicial?: boolean;
}) {
  const router = useRouter();
  const hoje = new Date().toISOString().slice(0, 10);
  const [titulo, setTitulo] = useState(
    inicial?.titulo ?? (especialInicial ? "Programação especial" : "Culto"),
  );
  const [data, setData] = useState(inicial?.data ?? hoje);
  const [especial, setEspecial] = useState(
    inicial?.especial ?? especialInicial,
  );
  const [blocos, setBlocos] = useState<Bloco[]>(
    inicial?.blocos.map((bloco) => ({ ...bloco, direcao: bloco.direcao ?? "" })) ?? [
      {
        nome: "PRIMEIRO CULTO",
        direcao: "",
        alocacoes: [
          {
            integranteId: "",
            funcaoId: primeiraFuncao(funcoes, "MUSICO"),
            sessao: "MUSICO",
            musicaId: "",
          },
          {
            integranteId: "",
            funcaoId: primeiraFuncao(funcoes, "CANTOR"),
            sessao: "CANTOR",
            musicaId: "",
          },
        ],
      },
    ],
  );
  const [arquivosPorLinha, setArquivosPorLinha] = useState<Record<string, File[]>>({});
  const [arquivosExistentes, setArquivosExistentes] = useState<ArquivoEscalaResumo[]>(
    inicial?.arquivos ?? [],
  );

  function chaveLinha(blocoIndice: number, linhaIndice: number) {
    return `${blocoIndice}-${linhaIndice}`;
  }
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const funcoesMusicos = funcoes.filter((item) => item.grupo === "MUSICO");
  const funcoesCantores = funcoes.filter((item) => item.grupo === "CANTOR");

  const pessoasMusicos = useMemo(
    () =>
      integrantes.filter(
        (pessoa) =>
          pessoa.perfil === "MUSICO" ||
          pessoa.perfil === "AMBOS" ||
          pessoa.funcoes.some((funcao) => funcao.grupo === "MUSICO"),
      ),
    [integrantes],
  );
  const pessoasCantores = useMemo(
    () =>
      integrantes.filter(
        (pessoa) =>
          pessoa.perfil === "CANTOR" ||
          pessoa.perfil === "AMBOS" ||
          pessoa.funcoes.some((funcao) => funcao.grupo === "CANTOR"),
      ),
    [integrantes],
  );

  function atualizarBloco(indice: number, patch: Partial<Bloco>) {
    setBlocos((atual) =>
      atual.map((bloco, i) => (i === indice ? { ...bloco, ...patch } : bloco)),
    );
  }

  function atualizarLinha(
    blocoIndice: number,
    linhaIndice: number,
    patch: Partial<Linha>,
  ) {
    setBlocos((atual) =>
      atual.map((bloco, i) =>
        i === blocoIndice
          ? {
              ...bloco,
              alocacoes: bloco.alocacoes.map((linha, j) =>
                j === linhaIndice ? { ...linha, ...patch } : linha,
              ),
            }
          : bloco,
      ),
    );
  }

  function adicionarLinha(blocoIndice: number, sessao: SessaoEscala) {
    setBlocos((atual) =>
      atual.map((bloco, i) =>
        i === blocoIndice
          ? {
              ...bloco,
              alocacoes: [
                ...bloco.alocacoes,
                {
                  integranteId: "",
                  funcaoId: primeiraFuncao(funcoes, sessao),
                  sessao,
                  musicaId: "",
                },
              ],
            }
          : bloco,
      ),
    );
  }

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro("");
    const limpos = blocos.map((bloco) => ({
      ...bloco,
      alocacoes: bloco.alocacoes.filter((linha) => linha.integranteId),
    }));
    if (limpos.some((bloco) => bloco.alocacoes.length === 0)) {
      setErro("Cada culto precisa de ao menos um músico ou cantor.");
      return;
    }
    setEnviando(true);
    try {
      const resposta = await fetch(
        escalaId ? `/api/escalas/${escalaId}` : "/api/escalas",
        {
          method: escalaId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ titulo, data, especial, blocos: limpos }),
        },
      );
      const dados = await resposta.json();
      if (!resposta.ok) {
        setErro(dados.erro ?? "Não foi possível salvar.");
        return;
      }
      const idSalvo = String(dados.escala.id);
      const envios: { file: File; musicaId: string }[] = [];
      blocos.forEach((bloco, blocoIndice) => {
        bloco.alocacoes.forEach((linha, linhaIndice) => {
          if (
            !linha.integranteId ||
            linha.sessao !== "CANTOR" ||
            !linha.musicaId
          ) {
            return;
          }
          for (const file of arquivosPorLinha[chaveLinha(blocoIndice, linhaIndice)] ?? []) {
            envios.push({ file, musicaId: linha.musicaId });
          }
        });
      });
      if (envios.length) {
        const form = new FormData();
        for (const envio of envios) {
          form.append("arquivo", envio.file);
          form.append("musicaId", envio.musicaId);
        }
        const envio = await fetch(`/api/escalas/${idSalvo}/arquivo`, {
          method: "POST",
          body: form,
        });
        const corpo = await envio.json().catch(() => ({}));
        if (!envio.ok) {
          setErro(corpo.erro ?? "A escala foi salva, mas os arquivos não.");
          router.push(`/escalas/${idSalvo}`);
          router.refresh();
          return;
        }
      }
      router.push(`/escalas/${idSalvo}`);
      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Cabeçalho da escala">
          <input
            className="field"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Culto"
          />
        </Campo>
        <Campo label="Data">
          <input
            className="field"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            required
          />
        </Campo>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={especial}
          onChange={(e) => setEspecial(e.target.checked)}
        />
        Escala especial (programação especial)
      </label>
      <p className="rounded-2xl bg-bg-soft px-3 py-2 text-sm text-muted">
        Legenda que vai para o WhatsApp:{" "}
        <strong className="text-cream">
          {cabecalhoEscala(titulo || "Culto", `${data}T12:00:00.000Z`)}
        </strong>
      </p>

      {blocos.map((bloco, indice) => (
        <div key={indice} className="rounded-2xl border border-line p-4">
          <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Campo label="Culto / bloco">
              <input
                className="field"
                value={bloco.nome}
                onChange={(e) => atualizarBloco(indice, { nome: e.target.value })}
              />
            </Campo>
            <Campo label="Direção">
              <input
                className="field"
                value={bloco.direcao}
                onChange={(e) => atualizarBloco(indice, { direcao: e.target.value })}
                placeholder="Quem dirige este culto"
              />
            </Campo>
            {blocos.length > 1 ? (
              <Botao
                type="button"
                variant="ghost"
                onClick={() => setBlocos((atual) => atual.filter((_, i) => i !== indice))}
              >
                <Trash2 size={16} />
              </Botao>
            ) : (
              <span className="hidden sm:block" />
            )}
          </div>

          <SessaoMontagem
            titulo={rotuloSessao("MUSICO")}
            sessao="MUSICO"
            bloco={bloco}
            blocoIndice={indice}
            funcoes={funcoesMusicos.length ? funcoesMusicos : funcoes}
            pessoas={pessoasMusicos.length ? pessoasMusicos : integrantes}
            musicas={musicas}
            onChangeLinha={atualizarLinha}
            onRemoveLinha={(linhaIndice) =>
              atualizarBloco(indice, {
                alocacoes: bloco.alocacoes.filter((_, i) => i !== linhaIndice),
              })
            }
            onAdd={() => adicionarLinha(indice, "MUSICO")}
          />

          <SessaoMontagem
            titulo={rotuloSessao("CANTOR")}
            sessao="CANTOR"
            bloco={bloco}
            blocoIndice={indice}
            funcoes={funcoesCantores.length ? funcoesCantores : funcoes}
            pessoas={pessoasCantores.length ? pessoasCantores : integrantes}
            musicas={musicas}
            onChangeLinha={atualizarLinha}
            onRemoveLinha={(linhaIndice) =>
              atualizarBloco(indice, {
                alocacoes: bloco.alocacoes.filter((_, i) => i !== linhaIndice),
              })
            }
            onAdd={() => adicionarLinha(indice, "CANTOR")}
            escalaId={escalaId}
            arquivosExistentes={arquivosExistentes}
            onRemoverArquivo={(arquivoId) =>
              setArquivosExistentes((atual) => atual.filter((item) => item.id !== arquivoId))
            }
            arquivosPorLinha={arquivosPorLinha}
            onArquivosLinha={(linhaIndice, files) =>
              setArquivosPorLinha((atual) => ({
                ...atual,
                [chaveLinha(indice, linhaIndice)]: files,
              }))
            }
          />
        </div>
      ))}

      <Botao
        type="button"
        variant="ghost"
        onClick={() =>
          setBlocos((atual) => [
            ...atual,
            {
              nome: `CULTO ${atual.length + 1}`,
              direcao: "",
              alocacoes: [
                {
                  integranteId: "",
                  funcaoId: primeiraFuncao(funcoes, "MUSICO"),
                  sessao: "MUSICO",
                  musicaId: "",
                },
                {
                  integranteId: "",
                  funcaoId: primeiraFuncao(funcoes, "CANTOR"),
                  sessao: "CANTOR",
                  musicaId: "",
                },
              ],
            },
          ])
        }
      >
        <Plus size={16} />
        Adicionar culto / bloco
      </Botao>

      {erro && <p className="text-sm text-danger">{erro}</p>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Botao type="submit" disabled={enviando}>
          {enviando ? "Salvando..." : "Salvar escala"}
        </Botao>
        <BotaoLink href={escalaId ? `/escalas/${escalaId}` : "/escalas"} variant="ghost">
          Cancelar
        </BotaoLink>
      </div>
    </form>
  );
}

function SessaoMontagem({
  titulo,
  sessao,
  bloco,
  blocoIndice,
  funcoes,
  pessoas,
  musicas,
  onChangeLinha,
  onRemoveLinha,
  onAdd,
  escalaId,
  arquivosExistentes = [],
  onRemoverArquivo,
  arquivosPorLinha = {},
  onArquivosLinha,
}: {
  titulo: string;
  sessao: SessaoEscala;
  bloco: Bloco;
  blocoIndice: number;
  funcoes: Funcao[];
  pessoas: IntegranteResumo[];
  musicas: MusicaResumo[];
  onChangeLinha: (blocoIndice: number, linhaIndice: number, patch: Partial<Linha>) => void;
  onRemoveLinha: (linhaIndice: number) => void;
  onAdd: () => void;
  escalaId?: string;
  arquivosExistentes?: ArquivoEscalaResumo[];
  onRemoverArquivo?: (arquivoId: string) => void;
  arquivosPorLinha?: Record<string, File[]>;
  onArquivosLinha?: (linhaIndice: number, files: File[]) => void;
}) {
  const linhas = bloco.alocacoes
    .map((linha, indice) => ({ linha, indice }))
    .filter((item) => item.linha.sessao === sessao);
  const musicasAtivas = musicas.filter(
    (musica) =>
      musica.ativo || linhas.some((item) => item.linha.musicaId === musica.id),
  );

  return (
    <section className="mb-5 rounded-2xl bg-bg-soft/70 p-3 last:mb-0">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gold">{titulo}</p>
      <div className="space-y-3">
        {linhas.map(({ linha, indice }) => {
          const chave = `${blocoIndice}-${indice}`;
          const novos = arquivosPorLinha[chave] ?? [];
          const existentesMusica = linha.musicaId
            ? arquivosDaMusica(arquivosExistentes, linha.musicaId)
            : [];
          return (
            <div key={`${sessao}-${indice}`} className="space-y-2">
              <div
                className={`grid gap-2 ${
                  sessao === "CANTOR"
                    ? "sm:grid-cols-[1fr_1fr_1fr_auto]"
                    : "sm:grid-cols-[1fr_1fr_auto]"
                }`}
              >
                <select
                  className="field"
                  value={linha.funcaoId}
                  onChange={(e) =>
                    onChangeLinha(blocoIndice, indice, { funcaoId: e.target.value })
                  }
                >
                  <option value="">Sem função</option>
                  {funcoes.map((funcao) => (
                    <option key={funcao.id} value={funcao.id}>
                      {funcao.nome}
                    </option>
                  ))}
                </select>
                <select
                  className="field"
                  value={linha.integranteId}
                  onChange={(e) =>
                    onChangeLinha(blocoIndice, indice, { integranteId: e.target.value })
                  }
                >
                  <option value="">Selecione o nome</option>
                  {pessoas.map((pessoa) => (
                    <option key={pessoa.id} value={pessoa.id}>
                      {pessoa.nome}
                    </option>
                  ))}
                </select>
                {sessao === "CANTOR" && (
                  <select
                    className="field"
                    value={linha.musicaId ?? ""}
                    onChange={(e) =>
                      onChangeLinha(blocoIndice, indice, { musicaId: e.target.value })
                    }
                  >
                    <option value="">Sem música</option>
                    {musicasAtivas.map((musica) => (
                      <option key={musica.id} value={musica.id}>
                        {musica.titulo}
                      </option>
                    ))}
                  </select>
                )}
                <Botao type="button" variant="ghost" onClick={() => onRemoveLinha(indice)}>
                  <Trash2 size={16} />
                </Botao>
              </div>
              {sessao === "CANTOR" && linha.musicaId && onArquivosLinha && (
                <div className="rounded-xl border border-dashed border-line/80 bg-bg/50 p-3">
                  <p className="mb-2 text-xs text-muted">
                    Áudio ou cifra (PDF) desta música — somem no dia seguinte ao culto.
                  </p>
                  <input
                    className="field text-sm"
                    type="file"
                    multiple
                    accept=".mp3,.m4a,.wav,.ogg,.pdf,audio/*,application/pdf"
                    onChange={(e) =>
                      onArquivosLinha(indice, Array.from(e.target.files ?? []))
                    }
                  />
                  {novos.length > 0 && (
                    <p className="mt-1 text-xs text-muted">
                      Novos: {novos.map((arquivo) => arquivo.name).join(" · ")}
                    </p>
                  )}
                  {escalaId && existentesMusica.length > 0 && (
                    <ul className="mt-2 grid gap-1">
                      {existentesMusica.map((arquivo) => (
                        <li
                          key={arquivo.id}
                          className="flex items-center justify-between gap-2 text-sm"
                        >
                          <a
                            href={arquivo.path}
                            download={arquivo.nome}
                            className="truncate text-gold"
                          >
                            {arquivo.nome}
                          </a>
                          <Botao
                            type="button"
                            variant="ghost"
                            className="min-h-9 px-3 text-xs"
                            onClick={async () => {
                              await fetch(
                                `/api/escalas/${escalaId}/arquivo/${arquivo.id}`,
                                { method: "DELETE" },
                              );
                              onRemoverArquivo?.(arquivo.id);
                            }}
                          >
                            Remover
                          </Botao>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Botao type="button" variant="ghost" className="mt-3" onClick={onAdd}>
        <Plus size={16} />
        Adicionar {sessao === "MUSICO" ? "músico" : "cantor"}
      </Botao>
    </section>
  );
}
