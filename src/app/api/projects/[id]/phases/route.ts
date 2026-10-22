import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, { params }: Context) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase 尚未配置" }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const { id: project_id } = await params;
  const body = await request.json().catch(() => null) as { name?: string; position?: number; start_date?: string; due_date?: string } | null;
  if (!body?.name?.trim()) return NextResponse.json({ error: "阶段名称不能为空" }, { status: 400 });
  const { data, error } = await supabase.from("phases").insert({ project_id, name: body.name.trim(), position: body.position ?? 0, start_date: body.start_date ?? null, due_date: body.due_date ?? null }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}
