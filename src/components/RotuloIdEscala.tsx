import { EscalaIdCopiar } from "./EscalaIdCopiar";

/** Renderizado no servidor — o ID aparece mesmo com cache antigo de JS. */
export function RotuloIdEscala({ id }: { id: string }) {
  return (
    <div className="-mt-2 mb-5 flex flex-col gap-2 rounded-xl border border-gold/30 bg-bg-soft/90 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-gold">
          ID da escala
        </p>
        <code className="mt-1 block break-all font-mono text-sm leading-snug text-cream">
          {id}
        </code>
      </div>
      <EscalaIdCopiar id={id} />
    </div>
  );
}
