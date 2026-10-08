import { CAMPOS_CARGO, NIVEIS, TIPOS_MOBILIDADE } from "./types";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const texto = (v: unknown) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};
const numero = (v: unknown) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Math.round(Number(String(v).replace(/\./g, "").replace(",", ".")));
  return Number.isFinite(n) ? n : NaN;
};

export function validarCargo(body: Record<string, unknown>): Result<Record<string, string | number | null>> {
  const data: Record<string, string | number | null> = {};
  for (const campo of CAMPOS_CARGO) {
    data[campo] = campo === "piso" || campo === "teto" ? numero(body[campo]) : texto(body[campo]);
  }
  if (!data.nome) return { ok: false, error: "Informe o nome do cargo." };
  if (!data.nivel || !(NIVEIS as readonly string[]).includes(data.nivel as string))
    return { ok: false, error: `Nível precisa ser um destes: ${NIVEIS.join(", ")}.` };
  if (Number.isNaN(data.piso) || Number.isNaN(data.teto)) return { ok: false, error: "Piso e teto precisam ser números." };
  if ((data.piso as number) < 0 || (data.teto as number) < 0) return { ok: false, error: "Piso e teto não podem ser negativos." };
  if (data.piso !== null && data.teto !== null && (data.piso as number) > (data.teto as number))
    return { ok: false, error: "O piso não pode ser maior que o teto." };
  return { ok: true, data };
}

export function validarMobilidade(body: Record<string, unknown>): Result<{ origem_id: number; destino_id: number; tipo: string; observacao: string | null }> {
  const origem_id = Number(body.origem_id);
  const destino_id = Number(body.destino_id);
  const tipo = texto(body.tipo) ?? "Direta";
  if (!Number.isInteger(origem_id) || !Number.isInteger(destino_id)) return { ok: false, error: "Escolha o cargo de origem e o de destino." };
  if (origem_id === destino_id) return { ok: false, error: "Origem e destino precisam ser cargos diferentes." };
  if (!(TIPOS_MOBILIDADE as readonly string[]).includes(tipo)) return { ok: false, error: `Tipo precisa ser: ${TIPOS_MOBILIDADE.join(", ")}.` };
  return { ok: true, data: { origem_id, destino_id, tipo, observacao: texto(body.observacao) } };
}

export function erroBanco(e: unknown): { status: number; error: string } {
  const code = (e as { code?: string })?.code;
  if (code === "23505") return { status: 409, error: "Já existe um registro com esses dados (nome do cargo ou par origem/destino repetido)." };
  if (code === "23503") return { status: 400, error: "Um dos cargos escolhidos não existe mais." };
  if (code === "23514") return { status: 400, error: "Os valores violam uma regra do banco (piso maior que teto ou origem igual ao destino)." };
  console.error(e);
  return { status: 500, error: "Erro ao falar com o banco. Verifique a DATABASE_URL e tente de novo." };
}
