# Workstory｜技术设计

## 架构

- 前端：Next.js App Router、React、TypeScript、CSS Modules。
- 后端：Next.js Route Handlers，负责身份校验、参数校验和业务数据读写。
- 认证：Supabase Auth；`@supabase/ssr` 在 Next.js 服务端处理会话 Cookie，`src/proxy.ts` 刷新会话。
- 数据库：Supabase PostgreSQL；所有业务表启用 RLS，项目及子资源沿 `projects.owner_id` 校验归属。
- 部署：使用支持 Node.js 的 Next.js 部署环境；生产环境配置 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`。

## 数据模型

`auth.users` 关联用户；`projects` 归属用户并可关联模板；`phases` 和 `custom_fields` 归属项目；`tasks` 归属项目及可选阶段，额外字段存于 JSONB `custom_values`；`templates` 支持公开系统模板和用户私有模板。

任务状态保存为 `not_started`、`in_progress`、`completed`、`cancelled`。逾期状态由 `due_date < 当前日期 AND status 未完成` 推导，不重复保存冗余状态。完成后写 `completed_at`。

## API

Route Handlers 从 Supabase SSR cookie session 读取已认证用户，并使用 anon/publishable key 请求 Supabase。数据库 RLS 再次限制数据行访问，不能只依赖前端隐藏按钮。项目模板创建流程从模板配置复制阶段和起始任务。

当前项目 API 支持项目列表和创建、编辑 / 删除；子路由支持增加阶段、自定义字段和任务；任务支持更新和删除。

## 安全

- `supabase/schema.sql` 启用全部业务表的 RLS，并授权给 authenticated / public template reader。
- 项目使用 `owner_id = auth.uid()` 策略；阶段、字段、任务通过关联项目的 owner_id 判断。
- API 在写入前验证 Supabase 用户会话，输入字段设白名单并由数据库约束再次检查。
- service role key 不用于本应用；绝不放进 `NEXT_PUBLIC_*` 或提交到仓库。
- 登录关闭公开注册，用户由 Supabase 管理端创建。

## 文件结构

- `src/app/page.tsx`：演示工作台与视图交互。
- `src/app/api/`：项目、阶段、字段和任务的后端 API。
- `src/app/login/`：Supabase 密码登录。
- `src/lib/supabase/server.ts`、`src/proxy.ts`：服务端 Supabase 客户端和会话刷新。
- `supabase/schema.sql`：表结构、索引、模板种子和 RLS 策略。
- `PRD.md`：产品范围与验收目标。
