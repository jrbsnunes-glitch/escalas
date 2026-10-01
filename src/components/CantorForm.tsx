"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Botao, BotaoLink, Campo } from "./ui";
import { deveMostrarParametrosVoz } from "@/lib/integrante";
import type { IntegranteResumo } from "@/lib/types";

type Parametro = {
  id: string;
  categoria: string;
  valor: string;
  rotulo: string;
  ativo: boolean;
};

type Funcao = {
  id: string;
  nome: string;
  ativo: boolean;
};

export function CantorForm({
  cantor,
  parametros,
  funcoes,
}: {
  cantor?: IntegranteResumo;
  parametros: Parametro[];
  funcoes: Funcao[];
}) {
  const router = useRouter();
  const opcoes = (categoria: string) =>
    parametros.filter((p) => p.categoria === categoria && p.ativo);

  const [nome, setNome] = useState(cantor?.nome ?? "");
  const [nascimento, setNascimento] = useState(cantor?.nascimento ?? "");
  const [voz, setVoz] = useState(cantor?.voz ?? opcoes("voz")[0]?.valor ?? "");
  const [afinacao, setAfinacao] = useState(String(cantor?.afinacao ?? 3));
  const [tipoVoz, setTipoVoz] = useState(
    cantor?.tipoVoz ?? opcoes("tipoVoz")[0]?.valor ?? "",
  );
  const [leadVocal, setLeadVocal] = useState(
    cantor?.leadVocal ?? opcoes("leadVocal")[0]?.valor ?? "",
  );
  const [backingVocal, setBackingVocal] = useState(
    cantor?.backingVocal ?? opcoes("backingVocal")[0]?.valor ?? "",
  );
  const [perfil, setPerfil] = useState(cantor?.perfil ?? "CANTOR");
  const [funcoesIds, setFuncoesIds] = useState<string[]>(
    cantor?.funcoes.map((f) => f.id) ?? [],
  );
  const [ativo, setAtivo] = useState(cantor?.ativo ?? true);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const funcoesSelecionadas = funcoes.filter((funcao) =>
    funcoesIds.includes(funcao.id),
  );
  const mostrarParametrosVoz = deveMostrarParametrosVoz(perfil, funcoesSelecionadas);

  function toggleFuncao(id: string) {
    setFuncoesIds((atual) =>
      atual.includes(id) ? atual.filter((item) => item !== id) : [...atual, id],
    );
  }

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      const payload = mostrarParametrosVoz
        ? {
            nome,
            perfil,
            nascimento,
            voz,
            afinacao: Number(afinacao),
            tipoVoz,
            leadVocal,
            backingVocal,
            funcoesIds,
            ativo,
          }
        : {
            nome,
            perfil,
            nascimento,
            voz: "",
            afinacao: 0,
            tipoVoz: "",
            leadVocal: "",
            backingVocal: "",
            funcoesIds,
            ativo,
          };
      const resposta = await fetch(
        cantor ? `/api/cantores/${cantor.id}` : "/api/cantores",
        {
          method: cantor ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const dados = await resposta.json();
      if (!resposta.ok) {
        setErro(dados.erro ?? "Não foi possível salvar.");
        return;
      }
      router.push("/cantores");
      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  async function inativar() {
    if (!cantor) return;
    const resposta = await fetch(`/api/cantores/${cantor.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: false }),
    });
    if (!resposta.ok) {
      const dados = await resposta.json().catch(() => ({}));
      setErro(dados.erro ?? "Não foi possível inativar.");
      return;
    }
    router.push("/cantores");
    router.refresh();
  }

  async function excluir() {
    if (!cantor) return;
    if (
      !window.confirm(
        `Excluir o cadastro de ${cantor.nome}? Essa ação não pode ser desfeita. O nome também sai das escalas em que estiver.`,
      )
    ) {
      return;
    }
    const resposta = await fetch(`/api/cantores/${cantor.id}`, { method: "DELETE" });
    if (!resposta.ok) {
      const dados = await resposta.json().catch(() => ({}));
      setErro(dados.erro ?? "Não foi possível excluir.");
      return;
    }
    router.push("/cantores");
    router.refresh();
  }

  return (
    <form onSubmit={salvar} className="grid gap-4">
      <Campo label="Nome">
        <input className="field" value={nome} onChange={(e) => setNome(e.target.value)} required />
      </Campo>
      <Campo label="Nascimento">
        <input
          className="field"
          type="date"
          value={nascimento}
          onChange={(e) => setNascimento(e.target.value)}
        />
      </Campo>
      <Campo label="Atua como">
        <select className="field" value={perfil} onChange={(e) => setPerfil(e.target.value as typeof perfil)}>
          <option value="CANTOR">Cantor</option>
          <option value="MUSICO">Músico</option>
          <option value="AMBOS">Cantor e músico</option>
        </select>
      </Campo>
      <Campo label="Funções que pode exercer (opcional)">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {funcoes
            .filter((f) => f.ativo)
            .map((funcao) => (
              <label
                key={funcao.id}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  funcoesIds.includes(funcao.id)
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-line"
                }`}
              >
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={funcoesIds.includes(funcao.id)}
                  onChange={() => toggleFuncao(funcao.id)}
                />
                {funcao.nome}
              </label>
            ))}
        </div>
      </Campo>
      {mostrarParametrosVoz && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Voz">
              <select className="field" value={voz} onChange={(e) => setVoz(e.target.value)}>
                {opcoes("voz").map((op) => (
                  <option key={op.id} value={op.valor}>
                    {op.rotulo}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Afinação">
              <select className="field" value={afinacao} onChange={(e) => setAfinacao(e.target.value)}>
                {opcoes("afinacao").map((op) => (
                  <option key={op.id} value={op.valor}>
                    {op.rotulo}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Tipo de voz">
              <select className="field" value={tipoVoz} onChange={(e) => setTipoVoz(e.target.value)}>
                {opcoes("tipoVoz").map((op) => (
                  <option key={op.id} value={op.valor}>
                    {op.rotulo}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Lead vocal">
              <select className="field" value={leadVocal} onChange={(e) => setLeadVocal(e.target.value)}>
                {opcoes("leadVocal").map((op) => (
                  <option key={op.id} value={op.valor}>
                    {op.rotulo}
                  </option>
                ))}
              </select>
            </Campo>
          </div>
          <Campo label="Backing vocal">
            <select
              className="field"
              value={backingVocal}
              onChange={(e) => setBackingVocal(e.target.value)}
            >
              {opcoes("backingVocal").map((op) => (
                <option key={op.id} value={op.valor}>
                  {op.rotulo}
                </option>
              ))}
            </select>
          </Campo>
        </>
      )}
      {cantor && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
          />
          Cantor ativo
        </label>
      )}
      {erro && <p className="text-sm text-danger">{erro}</p>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Botao type="submit" disabled={enviando}>
          {enviando ? "Salvando..." : "Salvar cantor"}
        </Botao>
        <BotaoLink href="/cantores" variant="ghost">
          Cancelar
        </BotaoLink>
        {cantor?.ativo && (
          <Botao type="button" variant="ghost" onClick={inativar}>
            Inativar
          </Botao>
        )}
        {cantor && (
          <Botao type="button" variant="danger" onClick={excluir}>
            Excluir cadastro
          </Botao>
        )}
      </div>
    </form>
  );
}
