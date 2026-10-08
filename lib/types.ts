export const NIVEIS = ["Júnior", "Pleno", "Sênior", "Especialista", "Coordenador"] as const;
export type Nivel = (typeof NIVEIS)[number];
export const TIPOS_MOBILIDADE = ["Direta", "Condicionada", "Nova Trilha"] as const;

export type Cargo = {
  id: number;
  nome: string;
  position: string | null;
  familia: string | null;
  area: string | null;
  time: string | null;
  nivel: string;
  papel: string | null;
  lider: string | null;
  piso: number | null;
  teto: number | null;
  descricao: string | null;
  foco: string | null;
  complexidade: string | null;
  autonomia: string | null;
  requisitos: string | null;
  updated_at?: string;
};

export type Mobilidade = {
  id: number;
  origem_id: number;
  destino_id: number;
  tipo: string;
  observacao: string | null;
};

export const CAMPOS_CARGO = [
  "nome", "position", "familia", "area", "time", "nivel", "papel", "lider",
  "piso", "teto", "descricao", "foco", "complexidade", "autonomia", "requisitos",
] as const;
