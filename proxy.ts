import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_EDITAR, COOKIE_VER, senhaEditar, senhaVer, token } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/login" || pathname === "/api/login") return NextResponse.next();

  const ehApi = pathname.startsWith("/api/");
  const editando = pathname.startsWith("/admin") || (ehApi && req.method !== "GET");

  const sEditar = senhaEditar();
  const sVer = senhaVer();
  const cEditar = req.cookies.get(COOKIE_EDITAR)?.value;
  const cVer = req.cookies.get(COOKIE_VER)?.value;
  const temEditar = !sEditar || (!!cEditar && cEditar === (await token("editar", sEditar)));
  const temVer = !sVer || temEditar || (!!cVer && cVer === (await token("ver", sVer)));

  if (editando ? temEditar : temVer) return NextResponse.next();

  if (ehApi)
    return NextResponse.json(
      { error: editando ? "Sua sessão não tem permissão para editar. Entre com a senha de edição." : "Sessão expirada. Entre de novo." },
      { status: 401 }
    );
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(pathname + req.nextUrl.search)}${editando ? "&modo=editar" : ""}`;
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|matter-logo.png).*)"] };
