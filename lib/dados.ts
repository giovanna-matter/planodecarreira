import { db } from "./db";
import { prepararBanco } from "./setup";
import { NIVEIS, type Cargo, type Mobilidade } from "./types";

export const ORDEM_AREAS = ["Produto", "Performance", "Backoffice", "Broady", "Compliance"];
export const DESCRICAO_AREAS: Record<string, string> = {
  Produto: "Tecnologia, dados e produto digital",
  Performance: "Mídia, conteúdo, retenção e design",
  Backoffice: "Pessoas, finanças e administrativo",
  Broady: "Sucesso do cliente",
  Compliance: "Qualidade e conformidade de mídia",
};
export const TOPO = 15000;

export type Trilha = { nome: string; area: string; cargos: Cargo[] };

export async function carregar() {
  await prepararBanco();
  const sql = db();
  const cargos = (await sql`select * from cargos order by nome`) as unknown as Cargo[];
  const mobilidades = (await sql`select * from mobilidades order by id`) as unknown as Mobilidade[];
  return { cargos, mobilidades };
}

export const ordemNivel = (n: string) => {
  const i = (NIVEIS as readonly string[]).indexOf(n);
  return i === -1 ? 0 : i;
};

export const slug = (t: string) =>
  t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const brl = (v: number) => "R$ " + v.toLocaleString("pt-BR");
export const faixa = (c: Cargo) => (c.piso != null && c.teto != null ? `${brl(c.piso)} a ${brl(c.teto)}` : "A definir");
export const pct = (v: number) => `${Math.min(100, Math.max(0, (v / TOPO) * 100)).toFixed(2)}%`;

export function ordenarAreas(areas: string[]) {
  return [...new Set(areas)].sort((a, b) => {
    const ia = ORDEM_AREAS.indexOf(a), ib = ORDEM_AREAS.indexOf(b);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    return a.localeCompare(b, "pt-BR");
  });
}

export function trilhas(cargos: Cargo[]): Trilha[] {
  const m = new Map<string, Cargo[]>();
  for (const c of cargos) {
    const k = c.familia || "Sem trilha";
    m.set(k, [...(m.get(k) ?? []), c]);
  }
  const lista = [...m.entries()].map(([nome, cs]) => {
    cs.sort((a, b) => ordemNivel(a.nivel) - ordemNivel(b.nivel) || (a.piso ?? 0) - (b.piso ?? 0) || a.nome.localeCompare(b.nome, "pt-BR"));
    // a área da trilha é a mais frequente entre os cargos
    const cont = new Map<string, number>();
    cs.forEach((c) => cont.set(c.area || "Sem área", (cont.get(c.area || "Sem área") ?? 0) + 1));
    const area = [...cont.entries()].sort((a, b) => b[1] - a[1])[0][0];
    return { nome, area, cargos: cs };
  });
  const areas = ordenarAreas(lista.map((t) => t.area));
  return lista.sort((a, b) => areas.indexOf(a.area) - areas.indexOf(b.area) || a.nome.localeCompare(b.nome, "pt-BR"));
}

export function faixaMaisComum(cargos: Cargo[]) {
  return NIVEIS.map((nivel, i) => {
    const cont = new Map<string, number>();
    cargos
      .filter((c) => c.nivel === nivel && c.piso != null && c.teto != null)
      .forEach((c) => cont.set(`${c.piso}-${c.teto}`, (cont.get(`${c.piso}-${c.teto}`) ?? 0) + 1));
    const top = [...cont.entries()].sort((a, b) => b[1] - a[1])[0];
    if (!top) return null;
    const [piso, teto] = top[0].split("-").map(Number);
    return { nivel, i, piso, teto };
  }).filter(Boolean) as { nivel: string; i: number; piso: number; teto: number }[];
}

export function focoComum(cs: Cargo[]) {
  const cont = new Map<string, number>();
  cs.forEach((c) => c.foco && cont.set(c.foco, (cont.get(c.foco) ?? 0) + 1));
  return [...cont.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

export function partesFoco(t: string | null) {
  if (!t) return { lead: null as string | null, partes: [] as [string, string][] };
  const pedacos = t.split(/\s*(?=(?:Objetivo|Atuação|Métricas):)/);
  const partes: [string, string][] = [];
  let lead: string | null = null;
  for (const p of pedacos) {
    const m = p.match(/^(Objetivo|Atuação|Métricas):\s*([\s\S]*)$/);
    if (m) partes.push([m[1], m[2].trim()]);
    else if (p.trim()) lead = p.trim();
  }
  return { lead, partes };
}

export function listaRequisitos(t: string | null) {
  if (!t) return [];
  const xs = t.split(/\n|;\s*/).map((x) => x.trim().replace(/^[.;]+|[.;]+$/g, "")).filter(Boolean);
  return xs.length >= 2 ? xs : [];
}
