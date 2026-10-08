import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __sql: ReturnType<typeof postgres> | undefined;
}

function connect() {
  const bruta = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!bruta) throw new Error("DATABASE_URL não configurada.");
  // O Neon inclui channel_binding=require na URL, mas o driver "postgres" não reconhece esse parâmetro
  const url = bruta.replace(/([?&])channel_binding=[^&]*&?/, "$1").replace(/[?&]$/, "");
  const local = /localhost|127\.0\.0\.1/.test(url);
  // prepare:false mantém compatibilidade com poolers (Neon/Supabase em modo transaction)
  return postgres(url, { ssl: local ? false : "require", max: 3, prepare: false, idle_timeout: 20, onnotice: () => {} });
}

export function db() {
  if (!globalThis.__sql) globalThis.__sql = connect();
  return globalThis.__sql;
}
