# Workstory｜可自定义工作流的项目与任务进度管理系统

面向个人和小团队的全栈项目管理课程设计。用户可以按自己的工作方式安排阶段、任务和自定义字段，并从列表、看板和时间轴查看进度。内置毕业设计 / 毕业论文流程模板，阶段日期不绑定具体学校。

## 当前交付

- Next.js App Router + TypeScript 应用，响应式中文工作台界面。
- 工作台支持列表、看板和时间轴；配置 Supabase 并登录后，项目和任务从数据库加载。
- 项目可创建空白项目或毕业设计模板项目，可切换和删除；项目阶段可新增、重命名、排序、设置起止日期及删除。
- 任务可按项目阶段创建并填写计划截止日期；搜索、筛选和完成状态切换可用。
- Supabase SSR 登录入口、项目 / 阶段 / 自定义字段 / 任务 API。
- PostgreSQL schema 覆盖模板、项目、阶段、自定义字段和任务，每张表启用 RLS。
- 毕业设计模板阶段和示例任务种子数据。

未配置 Supabase 或未登录时，工作台显示本地演示数据；登录后使用 Supabase 中真实项目。自定义字段编辑器、项目模板保存等功能仍可继续扩展。

## 本地运行

要求 Node.js 20.9 或更高版本。

```bash
npm install
npm run dev
```

打开 <http://localhost:3000> 查看演示工作台。当前演示无需 Supabase 配置。

## Supabase 配置

1. 在 Supabase 创建独立项目。
2. 在 SQL Editor 执行 [`supabase/schema.sql`](supabase/schema.sql)。脚本会创建数据表、索引、RLS 策略和公开的毕业设计模板。
3. 在 Supabase Authentication 中创建用户账号；项目不开放公开注册。
4. 复制 `.env.example` 为 `.env.local`，填写 Project URL 与 publishable/anon key。
5. 启动 Next.js 后访问 `/login` 登录。前端只使用可公开的 anon/publishable key；严禁将 service role key 放入环境变量前缀 `NEXT_PUBLIC_` 或浏览器代码。

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

### API 概览

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET / POST | `/api/projects` | 查询当前用户项目；创建项目，可从模板复制阶段和任务 |
| PATCH / DELETE | `/api/projects/:id` | 更新、归档字段或删除项目 |
| POST | `/api/projects/:id/phases` | 添加阶段 |
| PATCH / DELETE | `/api/phases/:id` | 编辑阶段名称、顺序、起止日期或删除阶段 |
| POST | `/api/projects/:id/fields` | 添加自定义字段 |
| POST | `/api/projects/:id/tasks` | 添加任务 |
| PATCH / DELETE | `/api/tasks/:id` | 更新或删除任务 |

API 通过 Supabase 用户会话鉴权，RLS 是最终的数据访问边界。具体接口请求字段可见 Route Handler 源码。

## GitHub 仓库

本项目使用独立仓库：[ermei159/workstory](https://github.com/ermei159/workstory)。当前 `main` 分支已推送。后续提交后，在本目录执行：

```bash
git add .
git commit -m "feat: describe your change"
git push
```

## 文档

- [产品需求 PRD](PRD.md)
- [技术设计](TECH_DESIGN.md)
- [数据库与 RLS](supabase/schema.sql)
- [项目协作约定](AGENTS.md)
