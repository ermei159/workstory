import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ id: string }> };

async function getClient() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: NextResponse.json({ error: "Supabase 尚未配置" }, { status: 503 }) };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "请先登录" }, { status: 401 }) };
  return { supabase };
}

export async function PATCH(request: Request, { params }: Context) {
  const auth = await getClient();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const body = await request.json().catch(() => null) as { name?: string; position?: number; start_date?: string | null; due_date?: string | null } | null;
  if (body?.name !== undefined && !body.name.trim()) return NextResponse.json({ error: "阶段名称不能为空" }, { status: 400 });
  const updates = Object.fromEntries(Object.entries(body ?? {}).filter(([key]) => ["name", "position", "start_date", "due_date"].includes(key)));
  const { data, error } = await auth.supabase.from("phases").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function DELETE(_request: Request, { params }: Context) {
  const auth = await getClient();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const { error } = await auth.supabase.from("phases").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return new Response(null, { status: 204 });
}
