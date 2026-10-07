import { EscalaIdCopiar } from "./EscalaIdCopiar";

export function IdentificadorEscala({
  id,
  compacto = false,
}: {
  id: string;
  compacto?: boolean;
}) {
  if (!id) return null;

  return (
    <div
      id={compacto ? undefined : "escala-id-rotulo"}
      data-escala-id={id}
      className={
        compacto
          ? "mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-gold/50 bg-gold/10 px-2.5 py-1.5"
          : "mt-3 flex flex-col gap-2 rounded-xl border-2 border-gold bg-gold/10 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
      }
    >
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gold">
          ID da escala
        </p>
        <p className="mt-0.5 break-all font-mono text-sm font-semibold leading-snug text-cream">
          {id}
        </p>
      </div>
      <EscalaIdCopiar id={id} />
    </div>
  );
}
