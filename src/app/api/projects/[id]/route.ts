import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
type Context = { params: Promise<{ id: string }> };
async function authenticated() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false as const, error: NextResponse.json({ error: "Supabase 尚未配置" }, { status: 503 }) };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: NextResponse.json({ error: "请先登录" }, { status: 401 }) };
  return { ok: true as const, supabase };
}
export async function PATCH(request: Request, { params }: Context) {
  const auth = await authenticated();
  if (!auth.ok) return auth.error;
  const { id } = await params;
  const body = await request.json().catch(() => null) as { name?: string; description?: string; target_date?: string | null; archived_at?: string | null } | null;
  const updates = Object.fromEntries(Object.entries(body ?? {}).filter(([key]) => ["name", "description", "target_date", "archived_at"].includes(key)));
  const { data, error } = await auth.supabase.from("projects").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
export async function DELETE(_request: Request, { params }: Context) {
  const auth = await authenticated();
  if (!auth.ok) return auth.error;
  const { id } = await params;
  const { error } = await auth.supabase.from("projects").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return new Response(null, { status: 204 });
}
