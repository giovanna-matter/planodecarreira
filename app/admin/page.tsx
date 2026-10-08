import { db } from "@/lib/db";
import { prepararBanco } from "@/lib/setup";
import type { Cargo, Mobilidade } from "@/lib/types";
import App from "@/components/App";
import "../admin.css";

export const dynamic = "force-dynamic";

export default async function Page() {
  let cargos: Cargo[] = [];
  let mobilidades: Mobilidade[] = [];
  let erro: string | null = null;
  try {
    await prepararBanco();
    const sql = db();
    cargos = (await sql`select * from cargos order by familia nulls last, piso nulls last, nome`) as unknown as Cargo[];
    mobilidades = (await sql`select * from mobilidades order by id`) as unknown as Mobilidade[];
  } catch (e) {
    erro = e instanceof Error ? e.message : String(e);
  }

  if (erro) {
    return (
      <main className="setup">
        <h1>Falta conectar o banco</h1>
        <p>A página não conseguiu ler os cargos: <code>{erro}</code></p>
        <ol>
          <li>Na Vercel, abra o projeto, vá em Storage e conecte um banco Postgres (Neon). Deixe o campo de prefixo vazio, para a variável se chamar <code>DATABASE_URL</code>.</li>
          <li>Em Deployments, faça um Redeploy do último deploy.</li>
          <li>Recarregue esta página. As tabelas e os dados da planilha são criados sozinhos no primeiro acesso.</li>
        </ol>
      </main>
    );
  }

  return <App initialCargos={JSON.parse(JSON.stringify(cargos))} initialMobilidades={JSON.parse(JSON.stringify(mobilidades))} temLogin={!!(process.env.APP_PASSWORD || process.env.ADMIN_PASSWORD)} />;
}
