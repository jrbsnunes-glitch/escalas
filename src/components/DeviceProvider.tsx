"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { classificarPorViewport, rotuloDispositivo } from "@/lib/device";
import type { TipoDispositivo } from "@/lib/types";

type Contexto = {
  dispositivo: TipoDispositivo;
  rotulo: string;
  isMobile: boolean;
};

const DeviceContext = createContext<Contexto>({
  dispositivo: "desktop",
  rotulo: "Computador",
  isMobile: false,
});

export function DeviceProvider({
  inicial,
  children,
}: {
  inicial: TipoDispositivo;
  children: React.ReactNode;
}) {
  const [dispositivo, setDispositivo] = useState<TipoDispositivo>(inicial);

  useEffect(() => {
    const atualizar = () => {
      const porTela = classificarPorViewport(window.innerWidth);
      setDispositivo(porTela);
      document.documentElement.dataset.device = porTela;
    };

    atualizar();
    window.addEventListener("resize", atualizar);
    return () => window.removeEventListener("resize", atualizar);
  }, []);

  const valor = useMemo(
    () => ({
      dispositivo,
      rotulo: rotuloDispositivo(dispositivo),
      isMobile: dispositivo === "mobile" || dispositivo === "tablet",
    }),
    [dispositivo],
  );

  return (
    <DeviceContext.Provider value={valor}>{children}</DeviceContext.Provider>
  );
}

export function useDevice() {
  return useContext(DeviceContext);
}
