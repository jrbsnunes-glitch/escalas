"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Botao, Campo, Card } from "./ui";

type Parametro = {
  id: string;
  categoria: string;
  valor: string;
  rotulo: string;
  ordem: number;
  ativo: boolean;
};

export type GrupoParametro = {
  id: string;
  titulo: string;
  descricao: string;
};

function codigoInterno(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ParametrosAdmin({
  parametros = [],
  grupos = [],
}: {
  parametros?: Parametro[];
  grupos?: GrupoParametro[];
}) {
  const router = useRouter();
  const [categoria, setCategoria] = useState(grupos[0]?.id ?? "voz");
  const [rotulo, setRotulo] = useState("");
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const porGrupo = useMemo(() => {
    const mapa = new Map<string, Parametro[]>();
    for (const grupo of grupos) mapa.set(grupo.id, []);
    for (const parametro of parametros) {
      const lista = mapa.get(parametro.categoria);
      if (lista) lista.push(parametro);
    }
    return mapa;
  }, [grupos, parametros]);

  async function criar(evento: FormEvent) {
    evento.preventDefault();
    setErro("");
    const nome = rotulo.trim();
    const interno = valor.trim() || codigoInterno(nome);
    if (!nome || !interno) {
      setErro("Informe o nome que aparece na tela.");
      return;
    }
    setEnviando(true);
    try {
      const resposta = await fetch("/api/parametros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoria, valor: interno, rotulo: nome }),
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) {
        setErro(dados.erro ?? "Não foi possível adicionar.");
        return;
      }
      setRotulo("");
      setValor("");
      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  async function alternar(parametro: Parametro) {
    await fetch("/api/parametros", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: parametro.id, ativo: !parametro.ativo }),
    });
    router.refresh();
  }

  async function excluir(parametro: Parametro) {
    if (
      !window.confirm(
        `Excluir "${parametro.rotulo}"? Essa ação não pode ser desfeita.`,
      )
    ) {
      return;
    }
    await fetch(`/api/parametros/${parametro.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="grid gap-5">
      <Card>
        <h2 className="font-display text-xl">Adicionar opção</h2>
        <p className="mt-1 mb-4 text-sm text-muted">
          Escolha o grupo e o nome que as pessoas vão ver no cadastro e na escala.
        </p>
        <form onSubmit={criar} className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
          <Campo label="Grupo">
            <select
              className="field"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              {grupos.map((grupo) => (
                <option key={grupo.id} value={grupo.id}>
                  {grupo.titulo}
                </option>
              ))}
            </select>
          </Campo>
          <Campo label="Nome na tela">
            <input
              className="field"
              value={rotulo}
              onChange={(e) => setRotulo(e.target.value)}
              placeholder="Ex.: Contralto"
              required
            />
          </Campo>
          <Campo label="Código interno (opcional)">
            <input
              className="field"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Gerado do nome"
            />
          </Campo>
          <Botao type="submit" disabled={enviando}>
            <Plus size={16} />
            {enviando ? "Salvando..." : "Adicionar"}
          </Botao>
        </form>
        {erro && <p className="mt-3 text-sm text-danger">{erro}</p>}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {grupos.map((grupo) => {
          const itens = porGrupo.get(grupo.id) ?? [];
          return (
            <Card key={grupo.id}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl">{grupo.titulo}</h2>
                  <p className="mt-1 text-sm text-muted">{grupo.descricao}</p>
                </div>
                <span className="shrink-0 rounded-full border border-line bg-bg-soft px-2.5 py-1 text-xs text-muted">
                  {itens.length} {itens.length === 1 ? "opção" : "opções"}
                </span>
              </div>
              {itens.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
                  Nenhuma opção neste grupo ainda.
                </p>
              ) : (
                <ul className="space-y-2">
                  {itens.map((parametro) => (
                    <li
                      key={parametro.id}
                      className="flex flex-col gap-3 rounded-2xl bg-bg-soft/80 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{parametro.rotulo}</p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] ${
                              parametro.ativo
                                ? "bg-ok/15 text-ok"
                                : "bg-line text-muted"
                            }`}
                          >
                            {parametro.ativo ? "Ativa" : "Inativa"}
                          </span>
                        </div>
                        {parametro.valor !== parametro.rotulo && (
                          <p className="mt-1 text-xs text-muted">
                            Código: {parametro.valor}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Botao
                          type="button"
                          variant="ghost"
                          className="min-h-9 px-3 text-xs"
                          onClick={() => alternar(parametro)}
                        >
                          {parametro.ativo ? "Inativar" : "Reativar"}
                        </Botao>
                        <Botao
                          type="button"
                          variant="ghost"
                          className="min-h-9 px-3 text-xs text-danger hover:bg-danger/10"
                          onClick={() => excluir(parametro)}
                        >
                          <Trash2 size={14} />
                          Excluir
                        </Botao>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
