import Image from "next/image";

export function Logo({
  size = 44,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/logo.png"
      alt="Escalas ministeriais"
      width={size}
      height={size}
      className={`rounded-2xl object-contain ${className}`}
      priority
    />
  );
}
