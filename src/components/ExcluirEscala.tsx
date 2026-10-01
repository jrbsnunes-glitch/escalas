"use client";

import { useRouter } from "next/navigation";
import { Botao } from "./ui";

export function ExcluirEscala({ id }: { id: string }) {
  const router = useRouter();

  async function excluir() {
    if (!window.confirm("Excluir esta escala do histórico?")) return;
    await fetch(`/api/escalas/${id}`, { method: "DELETE" });
    router.push("/escalas");
    router.refresh();
  }

  return (
    <Botao type="button" variant="danger" onClick={excluir}>
      Excluir
    </Botao>
  );
}
