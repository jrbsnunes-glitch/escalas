"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileDown, X } from "lucide-react";
import { Botao } from "./ui";
import {
  gerarPdfCartazCantores,
  gerarPngCartazCantores,
  montarQuadrosCantores,
  tituloCartaz,
  type ImagemCartaz,
  type QuadroSemana,
} from "@/lib/cartaz-cantores";
import { cabecalhoEscala } from "@/lib/escala";
import type { EscalaDetalhe } from "@/lib/types";

export function CartazCantores({ escalas }: { escalas: EscalaDetalhe[] }) {
  const idsMes = useMemo(() => idsDoMesAtual(escalas), [escalas]);
  const [selecionadas, setSelecionadas] = useState<string[]>(idsMes);
  const [gerando, setGerando] = useState(false);
  const [erroImagem, setErroImagem] = useState("");
  const [imagensSalvar, setImagensSalvar] = useState<
    { url: string; nome: string }[]
  >([]);

  const escolhidas = useMemo(
    () => escalas.filter((escala) => selecionadas.includes(escala.id)),
    [escalas, selecionadas],
  );
  const quadros = useMemo(() => montarQuadrosCantores(escolhidas), [escolhidas]);
  const titulo = tituloCartaz(quadros);

  function alternar(id: string) {
    setSelecionadas((atual) =>
      atual.includes(id) ? atual.filter((item) => item !== id) : [...atual, id],
    );
  }

  const imagensRef = useRef(imagensSalvar);
  imagensRef.current = imagensSalvar;
  useEffect(() => {
    return () => {
      imagensRef.current.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, []);

  function fecharImagens() {
    imagensSalvar.forEach((item) => URL.revokeObjectURL(item.url));
    setImagensSalvar([]);
  }

  async function baixarImagem() {
    setErroImagem("");
    setGerando(true);
    try {
      const resultado = await gerarPngCartazCantores(quadros);
      if (resultado.modo === "mostrar") {
        imagensSalvar.forEach((item) => URL.revokeObjectURL(item.url));
        setImagensSalvar(
          resultado.imagens.map((item: ImagemCartaz) => ({
            url: URL.createObjectURL(item.blob),
            nome: item.nome,
          })),
        );
      }
    } catch {
      setErroImagem(
        "Não foi possível gerar a imagem neste aparelho. Tente o PDF.",
      );
    } finally {
      setGerando(false);
    }
  }

  if (!escalas.length) {
    return (
      <p className="text-sm text-muted">
        Monte as escalas do mês para gerar o cartaz de cantores.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted">
          Marque as semanas. Cada quadro mostra só os cantores, separados por
          culto, com a data do domingo.
        </p>
        <ul className="mt-3 grid gap-2">
          {escalas.map((escala) => (
            <li key={escala.id}>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-bg-soft/60 px-3 py-2.5">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selecionadas.includes(escala.id)}
                  onChange={() => alternar(escala.id)}
                />
                <span>
                  <span className="block font-medium">
                    {cabecalhoEscala(escala.titulo, escala.data)}
                  </span>
                  <span className="text-xs text-muted">
                    {escala.blocos.length} culto(s)
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Botao
          type="button"
          disabled={!quadros.length}
          onClick={() => gerarPdfCartazCantores(quadros)}
        >
          <FileDown size={16} />
          Baixar PDF
        </Botao>
        <Botao
          type="button"
          variant="ghost"
          disabled={!quadros.length || gerando}
          onClick={baixarImagem}
        >
          <Download size={16} />
          {gerando ? "Gerando…" : "Baixar imagem"}
        </Botao>
      </div>
      {erroImagem ? <p className="text-sm text-danger">{erroImagem}</p> : null}

      {imagensSalvar.length > 0 ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-bg/95 p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
            <p className="text-sm text-muted">
              Toque e segure a imagem para salvar no celular.
            </p>
            <Botao type="button" variant="ghost" onClick={fecharImagens}>
              <X size={16} />
              Fechar
            </Botao>
          </div>
          <div className="mx-auto mt-3 flex w-full max-w-3xl flex-1 flex-col gap-4 overflow-auto">
            {imagensSalvar.map((item) => (
              <img
                key={item.nome}
                src={item.url}
                alt={item.nome}
                className="w-full rounded-2xl border border-line bg-bg-elev"
              />
            ))}
          </div>
        </div>
      ) : null}

      {quadros.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gold">
            Prévia
          </p>
          <PreviaCartaz titulo={titulo} quadros={quadros} />
        </div>
      ) : (
        <p className="text-sm text-muted">Selecione ao menos uma escala.</p>
      )}
    </div>
  );
}

function idsDoMesAtual(escalas: EscalaDetalhe[]) {
  const mesAtual = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
  const doMes = escalas.filter((escala) => escala.data.slice(0, 7) === mesAtual);
  if (doMes.length) return doMes.map((escala) => escala.id);
  return escalas.slice(0, 4).map((escala) => escala.id);
}

function PreviaCartaz({
  titulo,
  quadros,
}: {
  titulo: string;
  quadros: QuadroSemana[];
}) {
  return (
    <div className="rounded-3xl border border-line bg-[color:var(--bg)] p-4">
      <p className="mb-4 text-center font-display text-2xl">{titulo}</p>
      <div
        className={`grid gap-3 ${
          quadros.length === 1 ? "grid-cols-1" : "sm:grid-cols-2"
        }`}
      >
        {quadros.map((quadro) => (
          <article
            key={quadro.id}
            className="rounded-2xl border border-line bg-bg-elev p-4 shadow-[0_8px_24px_rgba(80,70,40,0.06)]"
          >
            <h3 className="font-display text-xl text-cream">{quadro.rotulo}</h3>
            <div className="mt-3 space-y-3">
              {quadro.cultos.map((culto) => (
                <div key={culto.nome}>
                  <p className="rounded-lg bg-bg-soft px-2 py-1 text-xs font-medium uppercase tracking-wide text-gold">
                    {culto.nome}
                  </p>
                  {culto.cantores.length ? (
                    <ul className="mt-2 space-y-1">
                      {culto.cantores.map((cantor) => (
                        <li
                          key={`${culto.nome}-${cantor.nome}-${cantor.papel}`}
                          className="flex items-baseline justify-between gap-3 text-sm"
                        >
                          <span className="text-muted">{cantor.papel}</span>
                          <strong className="text-right">{cantor.nome}</strong>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs italic text-muted">
                      Sem cantores neste culto.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
