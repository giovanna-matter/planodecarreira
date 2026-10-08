import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prepararBanco } from "@/lib/setup";
import { erroBanco, validarMobilidade } from "@/lib/validate";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const id = Number((await params).id);
  const v = validarMobilidade(await req.json().catch(() => ({})));
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  try {
    await prepararBanco();
    const sql = db();
    const [m] = await sql`update mobilidades set ${sql(v.data, "origem_id", "destino_id", "tipo", "observacao")} where id = ${id} returning *`;
    if (!m) return NextResponse.json({ error: "Mobilidade não encontrada." }, { status: 404 });
    return NextResponse.json(m);
  } catch (e) {
    const { status, error } = erroBanco(e);
    return NextResponse.json({ error }, { status });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const id = Number((await params).id);
  try {
    await prepararBanco();
    const sql = db();
    const r = await sql`delete from mobilidades where id = ${id}`;
    if (r.count === 0) return NextResponse.json({ error: "Mobilidade não encontrada." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const { status, error } = erroBanco(e);
    return NextResponse.json({ error }, { status });
  }
}
