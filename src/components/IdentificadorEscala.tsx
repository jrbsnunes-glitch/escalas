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
      className={compacto ? "mt-1 flex items-center gap-2" : "mt-2 flex items-center gap-2"}
    >
      <p className="min-w-0 truncate font-mono text-[11px] text-muted">
        ID {id}
      </p>
      <EscalaIdCopiar id={id} />
    </div>
  );
}
