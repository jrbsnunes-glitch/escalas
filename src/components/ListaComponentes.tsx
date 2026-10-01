"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CantorAcoes } from "./CantorAcoes";
import { Card } from "./ui";

export type ComponenteLista = {
  id: string;
  nome: string;
  ativo: boolean;
  voz: string;
  tipoVoz: string;
  afinacao: number;
  leadVocal: string;
  backingVocal: string;
  funcoes: string[];
  mostraVoz: boolean;
};

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  if (!valor) return null;
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted">{rotulo}</p>
      <p className="mt-0.5 text-sm">{valor}</p>
    </div>
  );
}

export function ListaComponentes({ componentes }: { componentes: ComponenteLista[] }) {
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return componentes;
    return componentes.filter((pessoa) => {
      const texto = [
        pessoa.nome,
        ...pessoa.funcoes,
        pessoa.voz,
        pessoa.tipoVoz,
        pessoa.leadVocal,
        pessoa.backingVocal,
      ]
        .join(" ")
        .toLowerCase();
      return texto.includes(termo);
    });
  }, [busca, componentes]);

  return (
    <div className="grid gap-4">
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
          Pesquisar
        </span>
        <input
          className="field max-w-md"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Nome, função ou tipo de voz"
        />
      </label>

      {filtrados.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
          Nenhum componente encontrado com essa pesquisa.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((pessoa) => (
            <Card key={pessoa.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/cantores/${pessoa.id}`}
                    className="font-display text-xl text-gold hover:underline"
                  >
                    {pessoa.nome}
                  </Link>
                  {pessoa.funcoes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {pessoa.funcoes.map((funcao) => (
                        <span
                          key={funcao}
                          className="rounded-full border border-line bg-bg-soft px-2.5 py-0.5 text-xs"
                        >
                          {funcao}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${
                    pessoa.ativo ? "bg-ok/15 text-ok" : "bg-danger/15 text-danger"
                  }`}
                >
                  {pessoa.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>

              {pessoa.mostraVoz ? (
                <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-bg-soft/80 px-3 py-3">
                  <Dado rotulo="Voz" valor={pessoa.voz} />
                  <Dado rotulo="Tipo" valor={pessoa.tipoVoz} />
                  <Dado rotulo="Afinação" valor={String(pessoa.afinacao)} />
                  <Dado rotulo="Lead vocal" valor={pessoa.leadVocal} />
                  <div className="col-span-2">
                    <Dado rotulo="Backing vocal" valor={pessoa.backingVocal} />
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted">
                  Músico sem classificação vocal — entra só pelas funções.
                </p>
              )}

              <div className="mt-4 pt-1">
                <CantorAcoes id={pessoa.id} nome={pessoa.nome} ativo={pessoa.ativo} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
