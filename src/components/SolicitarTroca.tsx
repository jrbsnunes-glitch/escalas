"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Botao, Campo } from "./ui";
import { substitutosParaTroca } from "@/lib/troca-regras";
import type { IntegranteResumo, MusicaResumo, SessaoEscala } from "@/lib/types";

export function SolicitarTroca({
  alocacaoId,
  sessao,
  funcao,
  pendente,
  musicas,
  integrantes,
}: {
  alocacaoId: string;
  sessao: SessaoEscala;
  funcao: { id: string; nome: string; grupo: string } | null;
  pendente: boolean;
  musicas: MusicaResumo[];
  integrantes: IntegranteResumo[];
}) {
  const router = useRouter();
  const sessaoMusico = sessao === "MUSICO";
  const candidatos = useMemo(
    () =>
      substitutosParaTroca(integrantes, {
        sessaoMusico,
        funcao,
      }),
    [integrantes, sessaoMusico, funcao],
  );
  const [aberto, setAberto] = useState(false);
  const [musicaId, setMusicaId] = useState(musicas[0]?.id ?? "");
  const [substitutoId, setSubstitutoId] = useState(candidatos[0]?.id ?? "");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (pendente) {
    return (
      <span className="rounded-full border border-gold/40 px-2.5 py-1 text-[11px] text-gold">
        Troca solicitada
      </span>
    );
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      const resposta = await fetch("/api/trocas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          sessaoMusico
            ? { alocacaoId, substitutoId }
            : { alocacaoId, musicaId, substitutoId },
        ),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        setErro(dados.erro ?? "Não foi possível enviar o pedido.");
        return;
      }
      setAberto(false);
      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="w-full sm:w-auto">
      {!aberto ? (
        <Botao
          type="button"
          variant="ghost"
          className="min-h-9 px-3 text-xs"
          onClick={() => setAberto(true)}
        >
          Solicitar Troca
        </Botao>
      ) : (
        <form onSubmit={enviar} className="mt-2 grid gap-2 sm:min-w-[220px]">
          {!sessaoMusico && (
            <Campo label="Música">
              <select
                className="field"
                value={musicaId}
                onChange={(e) => setMusicaId(e.target.value)}
                required
              >
                {musicas.length === 0 && <option value="">Sem músicas</option>}
                {musicas.map((musica) => (
                  <option key={musica.id} value={musica.id}>
                    {musica.titulo}
                  </option>
                ))}
              </select>
            </Campo>
          )}
          <Campo label={sessaoMusico ? `Quem assume${funcao?.nome ? ` (${funcao.nome})` : ""}` : "Cantor"}>
            <select
              className="field"
              value={substitutoId}
              onChange={(e) => setSubstitutoId(e.target.value)}
              required
            >
              {candidatos.length === 0 && (
                <option value="">
                  {sessaoMusico
                    ? "Ninguém com este instrumento no cadastro"
                    : "Sem Lead Vocal"}
                </option>
              )}
              {candidatos.map((pessoa) => (
                <option key={pessoa.id} value={pessoa.id}>
                  {pessoa.nome}
                </option>
              ))}
            </select>
          </Campo>
          {erro && <p className="text-xs text-danger">{erro}</p>}
          <div className="flex gap-2">
            <Botao
              type="submit"
              className="min-h-9 px-3 text-xs"
              disabled={enviando || !substitutoId}
            >
              {enviando ? "Enviando..." : "Enviar"}
            </Botao>
            <Botao
              type="button"
              variant="ghost"
              className="min-h-9 px-3 text-xs"
              onClick={() => setAberto(false)}
            >
              Cancelar
            </Botao>
          </div>
        </form>
      )}
    </div>
  );
}
