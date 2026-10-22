create extension if not exists pgcrypto;

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  is_public boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint templates_owner_name_unique unique (owner_id, name)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid references public.templates(id) on delete set null,
  name text not null,
  description text not null default '',
  archived_at timestamptz,
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.phases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  position integer not null default 0,
  start_date date,
  due_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.custom_fields (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  field_type text not null check (field_type in ('text','date','number','select','checkbox','link')),
  options jsonb not null default '[]'::jsonb,
  position integer not null default 0,
  required boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  phase_id uuid references public.phases(id) on delete set null,
  title text not null,
  description text not null default '',
  status text not null default 'not_started' check (status in ('not_started','in_progress','completed','cancelled')),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  start_date date,
  due_date date,
  completed_at timestamptz,
  result_url text,
  notes text not null default '',
  custom_values jsonb not null default '{}'::jsonb,
  assignee text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.templates (id, owner_id, name, description, is_public, config)
values (
  '10000000-0000-4000-8000-000000000001', null, '毕业设计进度模板',
  '相对进度安排，不绑定学校日期；创建项目后可自行调整阶段和任务。', true,
  '{"phases":[{"name":"选题与资料收集","position":0},{"name":"开题","position":1},{"name":"方案与中期检查","position":2},{"name":"核心工作","position":3},{"name":"论文初稿","position":4},{"name":"修改与定稿","position":5},{"name":"答辩准备","position":6},{"name":"答辩与归档","position":7}],"tasks":[{"title":"确定研究方向与核心问题","phase":"选题与资料收集","priority":"high","position":0},{"title":"整理近五年相关文献","phase":"选题与资料收集","priority":"medium","position":1},{"title":"完成开题报告初稿","phase":"开题","priority":"high","position":0},{"title":"设计研究方案与技术路线","phase":"方案与中期检查","priority":"medium","position":0},{"title":"完成中期检查材料","phase":"方案与中期检查","priority":"low","position":1},{"title":"完成核心研究或系统实现","phase":"核心工作","priority":"high","position":0},{"title":"撰写论文初稿并配图","phase":"论文初稿","priority":"medium","position":0},{"title":"根据意见修改并查重","phase":"修改与定稿","priority":"medium","position":0},{"title":"制作答辩演示文稿","phase":"答辩准备","priority":"low","position":0},{"title":"完成答辩与材料归档","phase":"答辩与归档","priority":"high","position":0}]}'::jsonb
) on conflict (id) do nothing;

create index if not exists projects_owner_idx on public.projects(owner_id);
create index if not exists phases_project_position_idx on public.phases(project_id, position);
create index if not exists tasks_project_due_idx on public.tasks(project_id, due_date);
create index if not exists tasks_phase_position_idx on public.tasks(phase_id, position);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at before update on public.projects for each row execute function public.set_updated_at();
drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at before update on public.tasks for each row execute function public.set_updated_at();

alter table public.templates enable row level security;
alter table public.projects enable row level security;
alter table public.phases enable row level security;
alter table public.custom_fields enable row level security;
alter table public.tasks enable row level security;

grant select, insert, update, delete on public.templates, public.projects, public.phases, public.custom_fields, public.tasks to authenticated;
grant select on public.templates to anon;

drop policy if exists "Owners manage templates" on public.templates;
create policy "Owners manage templates" on public.templates for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists "Public templates are readable" on public.templates;
create policy "Public templates are readable" on public.templates for select to anon, authenticated using (is_public = true);

drop policy if exists "Owners manage projects" on public.projects;
create policy "Owners manage projects" on public.projects for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

drop policy if exists "Owners manage phases" on public.phases;
create policy "Owners manage phases" on public.phases for all to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid())));

drop policy if exists "Owners manage custom fields" on public.custom_fields;
create policy "Owners manage custom fields" on public.custom_fields for all to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid())));

drop policy if exists "Owners manage tasks" on public.tasks;
create policy "Owners manage tasks" on public.tasks for all to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid())))
  with check (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid()))
    and (phase_id is null or exists (select 1 from public.phases ph where ph.id = phase_id and ph.project_id = public.tasks.project_id))
  );

comment on table public.templates is 'Built-in templates may have null owner_id and is_public=true; users may also create private reusable templates.';
comment on column public.tasks.custom_values is 'Custom field values keyed by custom_fields.id, validated against field types by the application.';
