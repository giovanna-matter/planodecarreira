import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prepararBanco } from "@/lib/setup";
import { erroBanco, validarMobilidade } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prepararBanco();
    const sql = db();
    return NextResponse.json(await sql`select * from mobilidades order by id`);
  } catch (e) {
    const { status, error } = erroBanco(e);
    return NextResponse.json({ error }, { status });
  }
}

export async function POST(req: Request) {
  const v = validarMobilidade(await req.json().catch(() => ({})));
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  try {
    await prepararBanco();
    const sql = db();
    const [m] = await sql`insert into mobilidades ${sql(v.data, "origem_id", "destino_id", "tipo", "observacao")} returning *`;
    return NextResponse.json(m, { status: 201 });
  } catch (e) {
    const { status, error } = erroBanco(e);
    return NextResponse.json({ error }, { status });
  }
}
