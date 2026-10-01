"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Botao } from "./ui";

type PromptInstalar = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstalarApp() {
  const [prompt, setPrompt] = useState<PromptInstalar | null>(null);
  const [instalado, setInstalado] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone;
    if (standalone) setInstalado(true);

    function capturar(evento: Event) {
      evento.preventDefault();
      setPrompt(evento as PromptInstalar);
    }

    window.addEventListener("beforeinstallprompt", capturar);
    return () => window.removeEventListener("beforeinstallprompt", capturar);
  }, []);

  if (instalado || !prompt) return null;

  async function instalar() {
    if (!prompt) return;
    await prompt.prompt();
    const escolha = await prompt.userChoice;
    if (escolha.outcome === "accepted") setInstalado(true);
    setPrompt(null);
  }

  return (
    <Botao type="button" variant="ghost" className="w-full text-xs sm:w-auto" onClick={instalar}>
      <Download size={16} />
      Instalar app
    </Botao>
  );
}
