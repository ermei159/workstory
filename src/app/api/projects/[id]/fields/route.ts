import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, { params }: Context) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase 尚未配置" }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const { id: project_id } = await params;
  const body = await request.json().catch(() => null) as { name?: string; field_type?: string; options?: unknown; position?: number; required?: boolean } | null;
  const supported = ["text", "date", "number", "select", "checkbox", "link"];
  if (!body?.name?.trim() || !body.field_type || !supported.includes(body.field_type)) return NextResponse.json({ error: "请提供字段名称和有效类型" }, { status: 400 });
  const { data, error } = await supabase.from("custom_fields").insert({ project_id, name: body.name.trim(), field_type: body.field_type, options: body.options ?? [], position: body.position ?? 0, required: body.required ?? false }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}
