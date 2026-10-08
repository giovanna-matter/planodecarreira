import { db } from "./db";
import seed from "@/data/seed.json";
import { CAMPOS_CARGO } from "./types";

// Cria as tabelas e importa os dados da planilha (data/seed.json) no primeiro acesso.
// A importação roda uma única vez: depois disso fica registrada em app_meta,
// então mesmo que todos os cargos sejam apagados pela página, nada é reimportado.

const SCHEMA = `
create table if not exists cargos (
  id           serial primary key,
  nome         text not null unique,
  position     text,
  familia      text,
  area         text,
  time         text,
  nivel        text not null default 'Júnior',
  papel        text,
  lider        text,
  piso         integer,
  teto         integer,
  descricao    text,
  foco         text,
  complexidade text,
  autonomia    text,
  requisitos   text,
  updated_at   timestamptz not null default now(),
  constraint faixa_valida check (piso is null or teto is null or piso <= teto)
);

create table if not exists mobilidades (
  id         serial primary key,
  origem_id  integer not null references cargos(id) on delete cascade,
  destino_id integer not null references cargos(id) on delete cascade,
  tipo       text not null default 'Direta',
  observacao text,
  unique (origem_id, destino_id),
  constraint origem_diferente check (origem_id <> destino_id)
);

create table if not exists app_meta (
  chave text primary key,
  valor text,
  criado_em timestamptz not null default now()
);
`;

type SeedCargo = Record<(typeof CAMPOS_CARGO)[number], string | number | null>;
type SeedMob = { origem: string; destino: string; tipo: string | null; observacao: string | null };

let pronto: Promise<void> | null = null;

export function prepararBanco() {
  if (!pronto) pronto = executar().catch((e) => { pronto = null; throw e; });
  return pronto;
}

async function executar() {
  const sql = db();
  await sql.begin(async (tx) => {
    // trava para que dois acessos simultâneos não importem em dobro
    await tx`select pg_advisory_xact_lock(724001)`;
    await tx.unsafe(SCHEMA);
    const [feito] = await tx`select 1 from app_meta where chave = 'seed'`;
    if (feito) return;

    const [{ count }] = await tx`select count(*)::int as count from cargos`;
    if (count === 0) {
      const cargos = (seed.cargos as unknown as SeedCargo[]).map((c) =>
        Object.fromEntries(CAMPOS_CARGO.map((k) => [k, c[k] ?? null]))
      );
      await tx`insert into cargos ${tx(cargos, ...CAMPOS_CARGO)}`;
      const rows = await tx`select id, nome from cargos`;
      const ids = new Map(rows.map((r) => [r.nome as string, r.id as number]));
      const mobs = (seed.mobilidades as SeedMob[])
        .filter((m) => ids.has(m.origem) && ids.has(m.destino))
        .map((m) => ({ origem_id: ids.get(m.origem)!, destino_id: ids.get(m.destino)!, tipo: m.tipo || "Direta", observacao: m.observacao }));
      if (mobs.length) await tx`insert into mobilidades ${tx(mobs, "origem_id", "destino_id", "tipo", "observacao")} on conflict do nothing`;
    }
    await tx`insert into app_meta (chave, valor) values ('seed', ${String(count === 0 ? seed.cargos.length : count)})`;
  });
}
