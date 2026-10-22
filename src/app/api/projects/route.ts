import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase 尚未配置" }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const { data, error } = await supabase.from("projects").select("*, phases(*), custom_fields(*), tasks(*)").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase 尚未配置" }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const body = await request.json().catch(() => null) as { name?: string; description?: string; template_id?: string | null } | null;
  if (!body?.name?.trim()) return NextResponse.json({ error: "项目名称不能为空" }, { status: 400 });
  const { data, error } = await supabase.from("projects").insert({ owner_id: user.id, name: body.name.trim(), description: body.description?.trim() ?? "", template_id: body.template_id ?? null }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (body.template_id) {
    const { data: template } = await supabase.from("templates").select("config").eq("id", body.template_id).single();
    const config = template?.config as { phases?: { name: string; position: number; start_date?: string; due_date?: string }[] } | undefined;
    if (config?.phases?.length) {
      const { data: phases, error: phaseError } = await supabase.from("phases").insert(config.phases.map((phase) => ({ ...phase, project_id: data.id }))).select("id, name, position");
      if (phaseError) return NextResponse.json({ error: `项目已创建，但模板阶段写入失败：${phaseError.message}`, data }, { status: 400 });
      const taskSeeds = config as typeof config & { tasks?: { title: string; phase: string; priority?: string; due_date?: string; position?: number }[] };
      const taskRows = (taskSeeds.tasks ?? []).flatMap((task) => {
        const phase = phases?.find((item) => item.name === task.phase);
        return phase ? [{ title: task.title, priority: task.priority ?? "medium", due_date: task.due_date ?? null, position: task.position ?? 0, project_id: data.id, phase_id: phase.id, status: "not_started" as const }] : [];
      });
      if (taskRows.length) {
        const { error: taskError } = await supabase.from("tasks").insert(taskRows);
        if (taskError) return NextResponse.json({ error: `项目已创建，但模板任务写入失败：${taskError.message}`, data }, { status: 400 });
      }
    }
  }
  return NextResponse.json({ data }, { status: 201 });
}
