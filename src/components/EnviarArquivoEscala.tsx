"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Botao } from "./ui";

export function EnviarArquivoEscala({ escalaId }: { escalaId: string }) {
  const router = useRouter();
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    setErro("");
    if (!arquivos.length) {
      setErro("Escolha ao menos um MP3 ou PDF.");
      return;
    }
    setEnviando(true);
    try {
      const form = new FormData();
      for (const arquivo of arquivos) {
        form.append("arquivo", arquivo);
        form.append("musicaId", "");
      }
      const resposta = await fetch(`/api/escalas/${escalaId}/arquivo`, {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const corpo = await resposta.json().catch(() => ({}));
      if (!resposta.ok) {
        setErro(corpo.erro ?? `Falha no envio (${resposta.status}).`);
        return;
      }
      setArquivos([]);
      router.refresh();
    } catch {
      setErro("Não foi possível enviar. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-gold/50 bg-gold/10 p-4">
      <p className="text-sm font-medium">Enviar áudio ou cifra</p>
      <p className="mt-1 text-xs text-muted">
        Os arquivos ficam visíveis para todos os componentes nesta ficha.
      </p>
      <input
        className="field mt-3 text-sm"
        type="file"
        multiple
        accept=".mp3,.m4a,.wav,.ogg,.pdf,audio/*,application/pdf"
        onChange={(e) => setArquivos(Array.from(e.target.files ?? []))}
      />
      {arquivos.length > 0 && (
        <p className="mt-2 text-xs text-muted">
          {arquivos.map((item) => item.name).join(" · ")}
        </p>
      )}
      {erro ? <p className="mt-2 text-sm text-danger">{erro}</p> : null}
      <Botao
        type="button"
        className="mt-3"
        disabled={enviando}
        onClick={() => void enviar()}
      >
        {enviando ? "Enviando..." : "Enviar arquivos"}
      </Botao>
    </div>
  );
}
