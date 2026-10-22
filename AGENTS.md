# 项目协作说明

- 本项目是独立的 Next.js App Router + TypeScript 全栈课程设计，与同级个人作品集分开维护。
- 默认界面语言为简体中文。界面中的“林同学”和任务资料均为演示内容，不代表真实个人经历。
- 数据层使用 Supabase PostgreSQL 和 Auth；新增数据库表必须启用 RLS，并添加按用户所有权控制的策略。
- 浏览器只允许使用 Supabase publishable / anon key。绝不将 service role key 放入前端、`NEXT_PUBLIC_` 环境变量或版本库。
- 修改业务字段时，同步更新类型、表单 / API 校验、`supabase/schema.sql`、PRD 和技术设计。
- 保持桌面与手机布局可用；所有表单字段提供明确标签；外链使用安全的 `rel` 属性。
- 不提交 `.env.local`、访问令牌或真实用户数据。
