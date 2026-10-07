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
          ? "mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-gold px-2.5 py-1.5"
          : "mt-4 flex w-full flex-col gap-2 rounded-xl bg-gold px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      }
    >
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#1a2420]">
          ID da escala
        </p>
        <p className="mt-0.5 break-all font-mono text-sm font-bold leading-snug text-[#1a2420] sm:text-base">
          {id}
        </p>
      </div>
      <EscalaIdCopiar id={id} />
    </div>
  );
}
