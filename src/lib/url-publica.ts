function hostLocal(host: string) {
  return (
    host.startsWith("127.0.0.1") ||
    host.startsWith("[::1]") ||
    host.startsWith("localhost")
  );
}

export function origemPublica(request: Request) {
  const encaminhado = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const hostPedido = request.headers.get("host") ?? "";
  const host =
    encaminhado || (!hostLocal(hostPedido) ? hostPedido : "");
  const protoEncaminhado = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const proto =
    protoEncaminhado ||
    (host.includes("ts.net") ? "https" : new URL(request.url).protocol.replace(":", ""));
  if (host) return `${proto}://${host}`;
  const env = process.env.PUBLIC_APP_URL?.replace(/\/$/, "");
  if (env) return env;
  return new URL(request.url).origin;
}

export function urlPublica(request: Request, caminho: string) {
  return new URL(caminho, `${origemPublica(request)}/`);
}
