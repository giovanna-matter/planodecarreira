import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prepararBanco } from "@/lib/setup";
import { erroBanco, validarCargo } from "@/lib/validate";
import { CAMPOS_CARGO } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prepararBanco();
    const sql = db();
    const cargos = await sql`select * from cargos order by familia nulls last, piso nulls last, nome`;
    return NextResponse.json(cargos);
  } catch (e) {
    const { status, error } = erroBanco(e);
    return NextResponse.json({ error }, { status });
  }
}

export async function POST(req: Request) {
  const v = validarCargo(await req.json().catch(() => ({})));
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  try {
    await prepararBanco();
    const sql = db();
    const [cargo] = await sql`insert into cargos ${sql(v.data, ...CAMPOS_CARGO)} returning *`;
    return NextResponse.json(cargo, { status: 201 });
  } catch (e) {
    const { status, error } = erroBanco(e);
    return NextResponse.json({ error }, { status });
  }
}
