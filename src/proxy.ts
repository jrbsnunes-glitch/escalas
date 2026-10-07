import { NextResponse, userAgent } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/constants";

const PUBLICOS = ["/login", "/api/auth/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { device } = userAgent(request);

  const tipoUa =
    device.type === "mobile"
      ? "mobile"
      : device.type === "tablet"
        ? "tablet"
        : "desktop";

  const publico = PUBLICOS.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`),
  );
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const api = pathname.startsWith("/api/");

  if (!token && !publico && !api) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    const redirecionar = NextResponse.redirect(login);
    redirecionar.headers.set("x-device-type", tipoUa);
    redirecionar.cookies.set("device_ua", tipoUa, { path: "/" });
    return redirecionar;
  }

  const resposta = NextResponse.next();
  resposta.headers.set("x-device-type", tipoUa);
  resposta.cookies.set("device_ua", tipoUa, { path: "/" });
  return resposta;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest|mp3|m4a|wav|ogg|pdf)$).*)",
  ],
};
