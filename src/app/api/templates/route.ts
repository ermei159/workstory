import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase 尚未配置" }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  const query = supabase.from("templates").select("id, name, description, is_public, config, created_at").eq("is_public", true);
  const { data: publicTemplates, error } = await query.order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!user) return NextResponse.json({ data: publicTemplates });
  const { data: ownTemplates, error: ownError } = await supabase.from("templates").select("id, name, description, is_public, config, created_at").eq("owner_id", user.id).order("name");
  if (ownError) return NextResponse.json({ error: ownError.message }, { status: 400 });
  const ids = new Set((publicTemplates ?? []).map((item) => item.id));
  return NextResponse.json({ data: [...(publicTemplates ?? []), ...(ownTemplates ?? []).filter((item) => !ids.has(item.id))] });
}
