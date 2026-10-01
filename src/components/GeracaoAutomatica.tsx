"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Botao, Campo } from "./ui";
import { CRITERIOS, type ConfigGeracao, type CriterioId } from "@/lib/types";

type Parametro = {
  categoria: string;
  valor: string;
  rotulo: string;
};

export function GeracaoAutomatica({
  totalAtivos,
  parametros,
  padrao,
}: {
  totalAtivos: number;
  parametros: Parametro[];
  padrao: ConfigGeracao;
}) {
  const router = useRouter();
  const hoje = new Date().toISOString().slice(0, 10);
  const [titulo, setTitulo] = useState("Escala vocal");
  const [data, setData] = useState(hoje);
  const [quantidadeEscalas, setQuantidadeEscalas] = useState(padrao.quantidadeEscalas);
  const [quantidadePorEscala, setQuantidadePorEscala] = useState(
    padrao.quantidadePorEscala,
  );
  const [sobra, setSobra] = useState(padrao.sobra);
  const [prioridade, setPrioridade] = useState<CriterioId[]>(padrao.prioridade);
  const [ativos, setAtivos] = useState<CriterioId[]>(padrao.criteriosAtivos);
  const [leadVocal, setLeadVocal] = useState(padrao.ancora.leadVocal);
  const [backingVocal, setBackingVocal] = useState(padrao.ancora.backingVocal);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const vagas = quantidadeEscalas * quantidadePorEscala;
  const leads = parametros.filter((p) => p.categoria === "leadVocal");
  const backings = parametros.filter((p) => p.categoria === "backingVocal");

  const avisoCompat = useMemo(() => {
    if (totalAtivos < vagas) {
      return `Há ${totalAtivos} cantores ativos para ${vagas} vagas.`;
    }
    if (totalAtivos > vagas) {
      return `${totalAtivos - vagas} cantor(es) ficarão de fora, salvo se a sobra for distribuída.`;
    }
    return "Quantidade compatível com o grupo ativo.";
  }, [totalAtivos, vagas]);

  function mover(id: CriterioId, direcao: -1 | 1) {
    setPrioridade((lista) => {
      const indice = lista.indexOf(id);
      const destino = indice + direcao;
      if (indice < 0 || destino < 0 || destino >= lista.length) return lista;
      const copia = [...lista];
      [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
      return copia;
    });
  }

  function toggleAtivo(id: CriterioId) {
    setAtivos((lista) =>
      lista.includes(id) ? lista.filter((item) => item !== id) : [...lista, id],
    );
  }

  function toggleValor(lista: string[], valor: string, setLista: (v: string[]) => void) {
    setLista(
      lista.includes(valor) ? lista.filter((item) => item !== valor) : [...lista, valor],
    );
  }

  async function gerar(evento: FormEvent) {
    evento.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      const resposta = await fetch("/api/escalas/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo,
          data,
          quantidadeEscalas,
          quantidadePorEscala,
          sobra,
          criteriosAtivos: ativos,
          prioridade,
          ancora: { leadVocal, backingVocal },
        }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        setErro(dados.erro ?? "Não foi possível gerar.");
        return;
      }
      router.push(`/escalas/${dados.escala.id}`);
      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={gerar} className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Título">
          <input className="field" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
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
        <Campo label="Quantidade de escalas (N)">
          <input
            className="field"
            type="number"
            min={1}
            value={quantidadeEscalas}
            onChange={(e) => setQuantidadeEscalas(Number(e.target.value))}
          />
        </Campo>
        <Campo label="Componentes por escala (M)">
          <input
            className="field"
            type="number"
            min={1}
            value={quantidadePorEscala}
            onChange={(e) => setQuantidadePorEscala(Number(e.target.value))}
          />
        </Campo>
      </div>

      <Campo label="Sobra de integrantes">
        <select className="field" value={sobra} onChange={(e) => setSobra(e.target.value as ConfigGeracao["sobra"])}>
          <option value="avisar">Avisar e deixar de fora</option>
          <option value="descartar">Descartar extras</option>
          <option value="distribuir">Distribuir extras nas escalas</option>
        </select>
      </Campo>

      <p className="rounded-2xl bg-bg-soft px-3 py-2 text-sm text-muted">{avisoCompat}</p>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
          Critérios e prioridade
        </p>
        <div className="space-y-2">
          {prioridade.map((id, indice) => {
            const info = CRITERIOS.find((c) => c.id === id)!;
            return (
              <div
                key={id}
                className="flex flex-col gap-2 rounded-2xl border border-line p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={ativos.includes(id)}
                    onChange={() => toggleAtivo(id)}
                  />
                  <span>
                    <span className="block font-medium">
                      {indice + 1}. {info.titulo}
                    </span>
                    <span className="text-sm text-muted">{info.descricao}</span>
                  </span>
                </label>
                <div className="flex gap-2">
                  <Botao type="button" variant="ghost" onClick={() => mover(id, -1)}>
                    <ArrowUp size={16} />
                  </Botao>
                  <Botao type="button" variant="ghost" onClick={() => mover(id, 1)}>
                    <ArrowDown size={16} />
                  </Botao>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="O que conta como âncora — Lead vocal">
          <div className="space-y-2">
            {leads.map((op) => (
              <label key={op.valor} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={leadVocal.includes(op.valor)}
                  onChange={() => toggleValor(leadVocal, op.valor, setLeadVocal)}
                />
                {op.rotulo}
              </label>
            ))}
          </div>
        </Campo>
        <Campo label="O que conta como âncora — Backing vocal">
          <div className="space-y-2">
            {backings.map((op) => (
              <label key={op.valor} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={backingVocal.includes(op.valor)}
                  onChange={() => toggleValor(backingVocal, op.valor, setBackingVocal)}
                />
                {op.rotulo}
              </label>
            ))}
          </div>
        </Campo>
      </div>

      {erro && <p className="text-sm text-danger">{erro}</p>}
      <Botao type="submit" disabled={enviando || totalAtivos === 0}>
        {enviando ? "Gerando..." : "Gerar e salvar escala"}
      </Botao>
    </form>
  );
}
