import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function PageHeader({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl tracking-tight text-cream sm:text-3xl lg:text-4xl">
          {titulo}
        </h1>
        {descricao && (
          <p className="mt-1 max-w-2xl text-sm text-muted">{descricao}</p>
        )}
      </div>
      {acao}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-3xl border border-line bg-bg-elev/90 p-4 shadow-[0_12px_32px_rgba(80,70,40,0.08)] sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

type BotaoProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
};

export function Botao({
  variant = "primary",
  className = "",
  ...props
}: BotaoProps) {
  const base =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition disabled:opacity-50";
  const estilos = {
    primary: "bg-gold text-cream hover:bg-gold-deep",
    ghost: "border border-line bg-transparent text-cream hover:bg-bg-soft",
    danger: "bg-danger text-white hover:opacity-90",
  };
  return <button className={`${base} ${estilos[variant]} ${className}`} {...props} />;
}

export function BotaoLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
}) {
  const base =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium";
  const estilos =
    variant === "primary"
      ? "bg-gold text-cream hover:bg-gold-deep"
      : "border border-line hover:bg-bg-soft";
  return (
    <Link href={href} className={`${base} ${estilos}`}>
      {children}
    </Link>
  );
}

export function Label({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
      {children}
    </label>
  );
}

export function Campo({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function Empty({
  titulo,
  descricao,
}: {
  titulo: string;
  descricao: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-4 py-10 text-center">
      <p className="font-medium">{titulo}</p>
      <p className="mt-1 text-sm text-muted">{descricao}</p>
    </div>
  );
}
