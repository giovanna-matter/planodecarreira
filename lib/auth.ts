// Dois níveis de acesso:
//   APP_PASSWORD   → ver o site (time todo)
//   ADMIN_PASSWORD → editar cargos e faixas (RH). Se não existir, a senha de ver também edita.
export const COOKIE_VER = "cs_ver";
export const COOKIE_EDITAR = "cs_editar";

export const senhaVer = () => process.env.APP_PASSWORD || "";
export const senhaEditar = () => process.env.ADMIN_PASSWORD || process.env.APP_PASSWORD || "";

export async function token(tipo: "ver" | "editar", senha: string) {
  const bytes = new TextEncoder().encode(`cargos-matter:${tipo}:${senha}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

// usado nas páginas (servidor) para decidir se mostra o atalho "Editar dados"
export async function podeEditar(cookieValor: string | undefined) {
  const s = senhaEditar();
  if (!s) return true;
  return !!cookieValor && cookieValor === (await token("editar", s));
}
