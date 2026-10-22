import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase 尚未配置" }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const allowed = ["title", "description", "phase_id", "status", "priority", "start_date", "due_date", "result_url", "notes", "custom_values", "assignee"];
  const updates = Object.fromEntries(Object.entries(body ?? {}).filter(([key]) => allowed.includes(key)));
  if (updates.status === "completed") updates.completed_at = new Date().toISOString();
  if (updates.status === "not_started" || updates.status === "in_progress") updates.completed_at = null;
  if (!Object.keys(updates).length) return NextResponse.json({ error: "没有可更新的字段" }, { status: 400 });
  const { data, error } = await supabase.from("tasks").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function DELETE(_request: Request, { params }: Context) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase 尚未配置" }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const { id } = await params;
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return new Response(null, { status: 204 });
}
