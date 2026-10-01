"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Botao, Campo } from "./ui";
import type { MusicaResumo } from "@/lib/types";

const POR_PAGINA = 10;

function normalizarBusca(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function RepertorioAdmin({
  musicas,
  podeEditar = true,
}: {
  musicas: MusicaResumo[];
  podeEditar?: boolean;
}) {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [busca, setBusca] = useState("");
  const [consulta, setConsulta] = useState("");
  const [pagina, setPagina] = useState(1);

  function limpar() {
    setTitulo("");
    setYoutubeUrl("");
    setEditandoId(null);
  }

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      const resposta = await fetch(editandoId ? `/api/musicas/${editandoId}` : "/api/musicas", {
        method: editandoId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, youtubeUrl }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        setErro(dados.erro ?? "Não foi possível salvar.");
        return;
      }
      limpar();
      router.refresh();
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível salvar.");
    } finally {
      setEnviando(false);
    }
  }

  function editar(musica: MusicaResumo) {
    setEditandoId(musica.id);
    setTitulo(musica.titulo);
    setYoutubeUrl(musica.youtubeUrl);
  }

  async function alternar(musica: MusicaResumo) {
    await fetch(`/api/musicas/${musica.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !musica.ativo }),
    });
    router.refresh();
  }

  async function excluir(musica: MusicaResumo) {
    if (
      !window.confirm(
        `Excluir "${musica.titulo}" do repertório? O vínculo some das escalas em que estiver.`,
      )
    ) {
      return;
    }
    await fetch(`/api/musicas/${musica.id}`, { method: "DELETE" });
    if (editandoId === musica.id) limpar();
    router.refresh();
  }

  const listaFiltrada = useMemo(() => {
    const termo = normalizarBusca(consulta);
    if (!termo) return musicas;
    return musicas.filter((musica) =>
      normalizarBusca(musica.titulo).includes(termo),
    );
  }, [musicas, consulta]);
  const totalPaginas = Math.max(1, Math.ceil(listaFiltrada.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = listaFiltrada.slice(
    (paginaAtual - 1) * POR_PAGINA,
    paginaAtual * POR_PAGINA,
  );

  return (
    <div className="grid gap-6">
      {podeEditar && (
        <form onSubmit={salvar} className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo label="Título da música">
              <input
                className="field"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex.: Grande é o Senhor"
                required
              />
            </Campo>
            <Campo label="Link do YouTube">
              <input
                className="field"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtu.be/..."
              />
            </Campo>
          </div>
          {erro && <p className="text-sm text-danger">{erro}</p>}
          <div className="flex flex-wrap gap-2">
            <Botao type="submit" disabled={enviando}>
              {enviando ? "Salvando..." : editandoId ? "Salvar alterações" : "Adicionar música"}
            </Botao>
            {editandoId && (
              <Botao type="button" variant="ghost" onClick={limpar}>
                Cancelar
              </Botao>
            )}
          </div>
        </form>
      )}

      {musicas.length === 0 ? (
        <p className="text-sm text-muted">Nenhuma música cadastrada ainda.</p>
      ) : (
        <>
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(evento) => {
          evento.preventDefault();
          setConsulta(busca);
          setPagina(1);
        }}
      >
        <input
          className="field flex-1"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Pesquisar música pelo título"
        />
        <Botao type="submit" variant="ghost">
          Pesquisar
        </Botao>
      </form>
      {listaFiltrada.length === 0 ? (
        <p className="text-sm text-muted">Nenhuma música encontrada para essa pesquisa.</p>
      ) : (
        <ul className="divide-y divide-line">
          {visiveis.map((musica) => (
            <li
              key={musica.id}
              className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{musica.titulo}</p>
                {podeEditar && (
                  <p className="text-xs text-muted">
                    {musica.ativo ? "Ativa" : "Inativa"}
                    {musica.youtubeUrl ? " · YouTube" : ""}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {musica.youtubeUrl && (
                  <a
                    href={musica.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-line px-4 text-sm hover:bg-bg-soft"
                  >
                    YouTube
                  </a>
                )}
                {podeEditar && (
                  <>
                    <Botao type="button" variant="ghost" onClick={() => editar(musica)}>
                      Editar
                    </Botao>
                    <Botao type="button" variant="ghost" onClick={() => alternar(musica)}>
                      {musica.ativo ? "Inativar" : "Reativar"}
                    </Botao>
                    <Botao type="button" variant="danger" onClick={() => excluir(musica)}>
                      Excluir
                    </Botao>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {totalPaginas > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted">
            Página {paginaAtual} de {totalPaginas} · {listaFiltrada.length} música
            {listaFiltrada.length === 1 ? "" : "s"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Botao
              type="button"
              variant="ghost"
              disabled={paginaAtual <= 1}
              onClick={() => setPagina((atual) => Math.max(1, atual - 1))}
            >
              Anterior
            </Botao>
            {Array.from({ length: totalPaginas }, (_, indice) => indice + 1).map((numero) => (
              <Botao
                key={numero}
                type="button"
                variant={numero === paginaAtual ? "primary" : "ghost"}
                className="min-w-11 px-3"
                onClick={() => setPagina(numero)}
              >
                {numero}
              </Botao>
            ))}
            <Botao
              type="button"
              variant="ghost"
              disabled={paginaAtual >= totalPaginas}
              onClick={() => setPagina((atual) => Math.min(totalPaginas, atual + 1))}
            >
              Próxima
            </Botao>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
