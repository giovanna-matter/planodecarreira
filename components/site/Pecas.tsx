import { NIVEIS } from "@/lib/types";

export function Nivel({ nivel }: { nivel: string }) {
  const i = Math.max(0, (NIVEIS as readonly string[]).indexOf(nivel));
  return <span className={`s-chip ch-${i}`}>{nivel}</span>;
}

export function Tipo({ tipo }: { tipo: string }) {
  const cls = tipo === "Direta" ? "tp-direta" : tipo === "Condicionada" ? "tp-cond" : "tp-nova";
  return <span className={`s-tipo ${cls}`}>{tipo === "Nova Trilha" ? "Nova trilha" : tipo}</span>;
}
