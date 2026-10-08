import { NextResponse } from "next/server";
import { COOKIE_EDITAR, COOKIE_VER, senhaEditar, senhaVer, token } from "@/lib/auth";

const opcoes = {
  httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30,
};

function destinoSeguro(next: string | null, base: string) {
  // só aceita caminhos internos, para ninguém usar o login para redirecionar a outro site
  const n = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return new URL(n, base);
}

export async function POST(req: Request) {
  const form = await req.formData();
  const tentativa = String(form.get("senha") ?? "");
  const modo = String(form.get("modo") ?? "ver");
  const next = String(form.get("next") ?? "/");
  const sVer = senhaVer();
  const sEditar = senhaEditar();

  const acertouEditar = !!sEditar && tentativa === sEditar;
  const acertouVer = !!sVer && tentativa === sVer;

  if (modo === "editar" ? !acertouEditar : !(acertouVer || acertouEditar)) {
    const volta = new URL("/login", req.url);
    volta.searchParams.set("erro", "1");
    volta.searchParams.set("next", next);
    if (modo === "editar") volta.searchParams.set("modo", "editar");
    return NextResponse.redirect(volta, 303);
  }

  const res = NextResponse.redirect(destinoSeguro(next, req.url), 303);
  if (acertouEditar) res.cookies.set(COOKIE_EDITAR, await token("editar", sEditar), opcoes);
  if (sVer && (acertouVer || acertouEditar)) res.cookies.set(COOKIE_VER, await token("ver", sVer), opcoes);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE_VER);
  res.cookies.delete(COOKIE_EDITAR);
  return res;
}

export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL("/login", req.url), 303);
  res.cookies.delete(COOKIE_VER);
  res.cookies.delete(COOKIE_EDITAR);
  return res;
}
