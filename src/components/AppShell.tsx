"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  Cake,
  Home,
  ListMusic,
  LogOut,
  Mic2,
  Settings2,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { DeviceProvider, useDevice } from "./DeviceProvider";
import { InstalarApp } from "./InstalarApp";
import { Logo } from "./Logo";
import type { TipoDispositivo } from "@/lib/types";
import type { Sessao } from "@/lib/types";
import { ehAdmin, rotuloPerfil } from "@/lib/perfis";
import { COOKIE_FUSO, juntarNomes } from "@/lib/datas";

const NAV_ADMIN = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/cantores", label: "Componentes", icon: Mic2 },
  { href: "/escalas", label: "Escalas", icon: CalendarDays },
  { href: "/aniversariantes", label: "Aniversariantes", icon: Cake },
  { href: "/repertorio", label: "Repertório", icon: ListMusic },
  { href: "/funcoes", label: "Funções", icon: SlidersHorizontal },
  { href: "/parametros", label: "Parâmetros", icon: Settings2 },
  { href: "/usuarios", label: "Usuários", icon: Users },
];

const NAV_MEMBRO = [
  { href: "/escalas", label: "Escala", icon: CalendarDays },
  { href: "/repertorio", label: "Repertório", icon: ListMusic },
  { href: "/aniversariantes", label: "Aniversariantes", icon: Cake },
];

function ShellInterno({
  sessao,
  pendentesTroca,
  aniversariantesHoje,
  children,
}: {
  sessao: Sessao;
  pendentesTroca: number;
  aniversariantesHoje: string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, rotulo } = useDevice();
  const nav = ehAdmin(sessao) ? NAV_ADMIN : NAV_MEMBRO;

  useEffect(() => {
    const fuso = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!fuso) return;
    const atual = document.cookie
      .split("; ")
      .find((item) => item.startsWith(`${COOKIE_FUSO}=`))
      ?.slice(COOKIE_FUSO.length + 1);
    const gravado = atual ? decodeURIComponent(atual) : "";
    if (gravado === fuso) return;
    document.cookie = `${COOKIE_FUSO}=${encodeURIComponent(fuso)}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.refresh();
  }, [router]);

  async function sair() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const ativo = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#e4dcc4,transparent_28%),linear-gradient(180deg,#f3efe4,#ebe4d4)]">
      {!isMobile && (
        <aside className="app-sidebar fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-line bg-bg-elev/90 px-4 py-6 backdrop-blur">
          <div className="mb-8 flex items-center gap-3 px-2">
            <Logo size={44} />
            <div>
              <p className="font-display text-lg leading-tight">Escalas</p>
              <p className="text-xs text-muted">{rotulo}</p>
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-1">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                    ativo(item.href)
                      ? "bg-gold/15 text-gold"
                      : "text-cream/80 hover:bg-bg-soft"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          {ehAdmin(sessao) && pendentesTroca > 0 && (
            <Link
              href="/trocas"
              className="mb-3 rounded-2xl border border-gold/40 bg-gold/10 px-3 py-3 text-sm text-gold"
            >
              {pendentesTroca} pedido{pendentesTroca === 1 ? "" : "s"} de troca para
              aprovar
            </Link>
          )}
          <div className="rounded-2xl border border-line bg-bg-soft p-3">
            <p className="truncate text-sm font-medium">{sessao.nome}</p>
            <p className="truncate text-xs text-muted">{sessao.email}</p>
            <p className="mt-1 text-[11px] text-gold">{rotuloPerfil(sessao.perfil)}</p>
            <button
              type="button"
              onClick={sair}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-line px-3 py-2 text-sm hover:bg-bg"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </aside>
      )}

      {isMobile && (
        <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-line bg-bg/90 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
          <div className="flex min-w-0 items-center gap-2">
            <Logo size={36} />
            <div className="min-w-0">
              <p className="truncate font-display text-lg leading-tight">Escalas</p>
              <p className="truncate text-[11px] text-muted">{sessao.nome}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <InstalarApp />
            <button
              type="button"
              onClick={sair}
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-line text-muted"
              aria-label="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
      )}

      {aniversariantesHoje.length > 0 && (
        <div
          className={`border-b border-gold/40 bg-gold/15 px-4 py-3 text-center text-sm text-cream ${
            isMobile ? "" : "ml-64"
          }`}
        >
          <span className="font-medium text-gold">Parabéns, {juntarNomes(aniversariantesHoje)}!</span>
          {" "}
          {aniversariantesHoje.length === 1
            ? "Hoje é o aniversário."
            : "Hoje é o aniversário de vocês."}
        </div>
      )}

      {isMobile && ehAdmin(sessao) && pendentesTroca > 0 && (
        <Link
          href="/trocas"
          className="block border-b border-gold/30 bg-gold/10 px-4 py-2 text-center text-sm text-gold"
        >
          {pendentesTroca} pedido{pendentesTroca === 1 ? "" : "s"} de troca para aprovar
        </Link>
      )}

      <main
        className={`app-pad min-h-screen px-4 py-5 sm:px-6 lg:px-8 ${
          isMobile ? "" : "ml-64 lg:ml-[16rem]"
        }`}
      >
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>

      {isMobile && (
        <nav className="app-bottom-nav fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg-elev/95 backdrop-blur">
          <div className="flex overflow-x-auto overscroll-x-contain px-1 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-w-[4.25rem] flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] leading-tight sm:min-w-0 sm:flex-1 sm:text-[11px] ${
                    ativo(item.href) ? "text-gold" : "text-muted"
                  }`}
                >
                  <Icon size={18} />
                  <span className="max-w-full truncate text-center">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

export function AppShell({
  sessao,
  dispositivo,
  pendentesTroca = 0,
  aniversariantesHoje = [],
  children,
}: {
  sessao: Sessao;
  dispositivo: TipoDispositivo;
  pendentesTroca?: number;
  aniversariantesHoje?: string[];
  children: React.ReactNode;
}) {
  return (
    <DeviceProvider inicial={dispositivo}>
      <ShellInterno
        sessao={sessao}
        pendentesTroca={pendentesTroca}
        aniversariantesHoje={aniversariantesHoje}
      >
        {children}
      </ShellInterno>
    </DeviceProvider>
  );
}
