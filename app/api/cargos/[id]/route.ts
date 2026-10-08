import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prepararBanco } from "@/lib/setup";
import { erroBanco, validarCargo } from "@/lib/validate";
import { CAMPOS_CARGO } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const id = Number((await params).id);
  const v = validarCargo(await req.json().catch(() => ({})));
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  try {
    await prepararBanco();
    const sql = db();
    const [cargo] = await sql`
      update cargos set ${sql(v.data, ...CAMPOS_CARGO)}, updated_at = now()
      where id = ${id} returning *`;
    if (!cargo) return NextResponse.json({ error: "Cargo não encontrado." }, { status: 404 });
    return NextResponse.json(cargo);
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
    const r = await sql`delete from cargos where id = ${id}`;
    if (r.count === 0) return NextResponse.json({ error: "Cargo não encontrado." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const { status, error } = erroBanco(e);
    return NextResponse.json({ error }, { status });
  }
}
