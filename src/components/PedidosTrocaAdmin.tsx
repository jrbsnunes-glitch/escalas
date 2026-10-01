"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Botao, Campo, Card, Empty } from "./ui";
import { cabecalhoEscala } from "@/lib/escala";
import { substitutosParaTroca } from "@/lib/troca-regras";
import type { IntegranteResumo, MusicaResumo } from "@/lib/types";

type Pedido = {
  id: string;
  alocacaoId: string;
  solicitante: { id: string; nome: string };
  substituto: { id: string; nome: string };
  musica: { id: string; titulo: string } | null;
  culto: string;
  escalaId: string;
  escalaTitulo: string;
  escalaData: string;
  papelAtual: string;
  funcao: { id: string; nome: string; grupo: string } | null;
  sessaoMusico: boolean;
  nomeAtual: string;
};

export function PedidosTrocaAdmin({
  pedidos,
  musicas,
  integrantes,
}: {
  pedidos: Pedido[];
  musicas: MusicaResumo[];
  integrantes: IntegranteResumo[];
}) {
  const router = useRouter();
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState<string | null>(null);
  const opcoesPorPedido = useMemo(
    () =>
      Object.fromEntries(
        pedidos.map((pedido) => [
          pedido.id,
          substitutosParaTroca(integrantes, {
            sessaoMusico: pedido.sessaoMusico,
            funcao: pedido.funcao,
            excetoId: pedido.solicitante.id,
          }),
        ]),
      ),
    [pedidos, integrantes],
  );
  const [edicoes, setEdicoes] = useState<
    Record<string, { musicaId: string; substitutoId: string }>
  >(() =>
    Object.fromEntries(
      pedidos.map((pedido) => {
        const validos = substitutosParaTroca(integrantes, {
          sessaoMusico: pedido.sessaoMusico,
          funcao: pedido.funcao,
          excetoId: pedido.solicitante.id,
        });
        const substitutoId = validos.some((pessoa) => pessoa.id === pedido.substituto.id)
          ? pedido.substituto.id
          : (validos[0]?.id ?? pedido.substituto.id);
        return [
          pedido.id,
          { musicaId: pedido.musica?.id ?? "", substitutoId },
        ];
      }),
    ),
  );

  async function resolver(id: string, acao: "aprovar" | "recusar") {
    setErro("");
    setEnviando(id);
    try {
      const pedido = pedidos.find((item) => item.id === id);
      const edicao = edicoes[id];
      const resposta = await fetch(`/api/trocas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao,
          substitutoId: edicao?.substitutoId,
          ...(pedido?.sessaoMusico ? {} : { musicaId: edicao?.musicaId }),
        }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        setErro(dados.erro ?? "Não foi possível atualizar o pedido.");
        return;
      }
      router.refresh();
    } finally {
      setEnviando(null);
    }
  }

  if (pedidos.length === 0) {
    return (
      <Empty
        titulo="Nenhum pedido pendente"
        descricao="Quando alguém solicitar troca na escala, o pedido aparece aqui para aprovação."
      />
    );
  }

  return (
    <div className="grid gap-4">
      {erro && <p className="text-sm text-danger">{erro}</p>}
      {pedidos.map((pedido) => {
        const edicao = edicoes[pedido.id] ?? {
          musicaId: pedido.musica?.id ?? "",
          substitutoId: pedido.substituto.id,
        };
        const candidatos = opcoesPorPedido[pedido.id] ?? [];
        return (
          <Card key={pedido.id}>
            <p className="text-xs uppercase tracking-wide text-gold">Pedido de troca</p>
            <h3 className="mt-1 font-display text-xl">
              {cabecalhoEscala(pedido.escalaTitulo, pedido.escalaData)}
            </h3>
            <p className="mt-1 text-sm text-muted">
              {pedido.culto} · {pedido.papelAtual} · {pedido.solicitante.nome} pediu
              substituição
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {!pedido.sessaoMusico && (
                <Campo label="Música">
                  <select
                    className="field"
                    value={edicao.musicaId}
                    onChange={(e) =>
                      setEdicoes((atual) => ({
                        ...atual,
                        [pedido.id]: { ...edicao, musicaId: e.target.value },
                      }))
                    }
                  >
                    {musicas.map((musica) => (
                      <option key={musica.id} value={musica.id}>
                        {musica.titulo}
                      </option>
                    ))}
                  </select>
                </Campo>
              )}
              <Campo
                label={
                  pedido.sessaoMusico
                    ? `Substituto${pedido.papelAtual ? ` (${pedido.papelAtual})` : ""}`
                    : "Cantor Lead Vocal"
                }
              >
                <select
                  className="field"
                  value={edicao.substitutoId}
                  onChange={(e) =>
                    setEdicoes((atual) => ({
                      ...atual,
                      [pedido.id]: { ...edicao, substitutoId: e.target.value },
                    }))
                  }
                >
                  {candidatos.length === 0 && (
                    <option value="">Ninguém habilitado para esta função</option>
                  )}
                  {candidatos.map((pessoa) => (
                    <option key={pessoa.id} value={pessoa.id}>
                      {pessoa.nome}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Botao
                type="button"
                disabled={enviando === pedido.id || !edicao.substitutoId}
                onClick={() => resolver(pedido.id, "aprovar")}
              >
                Aprovar e salvar
              </Botao>
              <Botao
                type="button"
                variant="ghost"
                disabled={enviando === pedido.id}
                onClick={() => resolver(pedido.id, "recusar")}
              >
                Recusar
              </Botao>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
