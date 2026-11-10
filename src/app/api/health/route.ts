import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** Teste rápido de conexão com o banco (ex.: pelo celular antes da apresentação). */
export async function GET() {
  if (!supabase) return NextResponse.json({ ok: false, db: "não configurado (faltam variáveis de ambiente)" }, { status: 503 });
  const t0 = Date.now();
  const { error } = await supabase.from("orders").select("id", { count: "exact", head: true });
  const ms = Date.now() - t0;
  if (error) return NextResponse.json({ ok: false, db: "erro", message: error.message, ms }, { status: 503 });
  return NextResponse.json({ ok: true, db: "conectado", ms });
}
